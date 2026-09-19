import { callNemotron } from "@/lib/nemotron/call";
import { parseModelJson } from "@/lib/nemotron/parse";
import { DECISIONS, type NemotronDecision } from "@/lib/nemotron/types";
import { sanitizeCreditCardJson } from "@/lib/pipeline/schema-sanitize";
import {
  FAMILY_SPEC,
  RED_TEAM_FAMILIES,
  type RedTeamFamily,
} from "@/lib/red-team/families";
import { GENERATION_SLOTS, SCHEMA_BRIEF } from "@/lib/red-team/schema-brief";
import { categoriesForFamily } from "@/lib/red-team/categories";
import { MUTABLE_KEYS, type MutableKey } from "@/lib/ruleset/order";

export type GeneratedCase = {
  id: string;
  index: number;
  family: RedTeamFamily;
  difficulty: string;
  expectedFraud: boolean;
  expectedDecision: NemotronDecision;
  description: string;
  trick: string;
  categories: MutableKey[];
  record: Record<string, unknown>;
};

const GENERATE_SYSTEM =
  "You are a credit-card fraud red team. Write one schema-valid transaction meant to trick a separate Nemotron scorer. Reply with one JSON object only. Escape quotes inside strings. No markdown.";

export async function generateOneCase(args: {
  index: number;
  total: number;
  usedIds: string[];
}): Promise<GeneratedCase> {
  const slot = GENERATION_SLOTS[(args.index - 1) % GENERATION_SLOTS.length];
  const spec = FAMILY_SPEC[slot.family];
  let lastError = "Nemotron did not return a usable case.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt = [
      `Case ${args.index} of ${args.total}. Family: ${slot.family}. Difficulty: ${slot.difficulty}.`,
      spec.description,
      `Default gold fraud=${spec.expectedFraud}. You may flip that only if you explain why in description.`,
      "Goal: edge, rare, or hard cases that a rules-based scorer might miss. Clean lookalikes must be genuinely safe.",
      args.usedIds.length ? `Do not reuse these transaction_id values: ${args.usedIds.join(", ")}.` : "",
      "Schema:",
      SCHEMA_BRIEF,
      "Return JSON:",
      `{
  "family": "${slot.family}",
  "difficulty": "${slot.difficulty}",
  "expected_fraud": true,
  "expected_decision": "decline",
  "description": "one or two sentences: why this is or is not fraud",
  "trick": "how this is meant to fool the scorer",
  "categories": ["velocity_behavioral"],
  "record": { ...one CreditCardTransaction... }
}`,
      "categories must be a subset of velocity_behavioral, geo_device, merchant_auth, attack_patterns, thresholds.",
      "record.label.is_fraud must match expected_fraud. record.label.confirmed_by must be red_team. record.source must be red_team_synthetic.",
    ]
      .filter(Boolean)
      .join("\n");

    const reply = await callNemotron(prompt, {
      system: GENERATE_SYSTEM,
      temperature: 0.7,
      maxTokens: 2800,
      timeoutMs: 90_000,
    });
    if (!reply.ok) {
      lastError = reply.error;
      continue;
    }

    const parsed = parseGenerated(reply.text, slot.family, slot.difficulty, args.index);
    if ("error" in parsed) {
      lastError = parsed.error;
      continue;
    }
    return parsed.case;
  }

  throw new Error(`Case ${args.index} failed after 3 Nemotron attempts. ${lastError}`);
}

function parseGenerated(
  raw: string,
  fallbackFamily: RedTeamFamily,
  fallbackDifficulty: string,
  index: number,
): { case: GeneratedCase } | { error: string } {
  const value = parseModelJson(raw);
  if (!isRecord(value)) return { error: "Red-team Nemotron did not return a JSON object." };

  const family = isFamily(String(value.family ?? fallbackFamily))
    ? (value.family as RedTeamFamily)
    : fallbackFamily;
  const recordValue = value.record;
  const sanitized = sanitizeCreditCardJson(recordValue);
  if (!sanitized.ok) return { error: sanitized.error };
  const record = sanitized.records[0];
  if (!record) return { error: "Generated record was empty after schema scrub." };

  const expectedFraud = Boolean(value.expected_fraud ?? FAMILY_SPEC[family].expectedFraud);
  const expectedDecision = normalizeDecision(value.expected_decision, expectedFraud);
  const stamp = String(record.transaction_id ?? `txn_rt_${index}`);
  record.transaction_id = stamp;
  record.source = "red_team_synthetic";
  record.label = {
    is_fraud: expectedFraud,
    fraud_type: expectedFraud ? family : null,
    confirmed_by: "red_team",
    chargeback_filed: false,
  };

  const categories = normalizeCategories(value.categories, family);

  return {
    case: {
      id: stamp,
      index,
      family,
      difficulty: String(value.difficulty ?? fallbackDifficulty),
      expectedFraud,
      expectedDecision,
      description: String(value.description ?? FAMILY_SPEC[family].description),
      trick: String(value.trick ?? ""),
      categories,
      record,
    },
  };
}

function normalizeDecision(value: unknown, expectedFraud: boolean): NemotronDecision {
  const text = String(value ?? "");
  if (DECISIONS.includes(text as NemotronDecision)) return text as NemotronDecision;
  return expectedFraud ? "decline" : "approve";
}

function normalizeCategories(value: unknown, family: RedTeamFamily): MutableKey[] {
  const listed = Array.isArray(value)
    ? value.map((item) => String(item)).filter((item): item is MutableKey => MUTABLE_KEYS.includes(item as MutableKey))
    : [];
  const merged = new Set<MutableKey>([...listed, ...categoriesForFamily(family)]);
  return MUTABLE_KEYS.filter((key) => merged.has(key));
}

function isFamily(value: string): value is RedTeamFamily {
  return (RED_TEAM_FAMILIES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
