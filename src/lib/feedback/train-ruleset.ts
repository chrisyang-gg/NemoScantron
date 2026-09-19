import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { completeJson } from "@/lib/ai/engine";
import { localAnalyze } from "@/lib/nemotron/local-analyze";
import { runAnalyze } from "@/lib/nemotron/run-analyze";
import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { generateFraudBatch, type GeneratedCase } from "@/lib/red-team/generate";
import { IMMUTABLE_FILES, MUTABLE_FILE_BY_KEY, type MutableKey } from "@/lib/ruleset/order";
import { RULESET_DIR } from "@/lib/ruleset/assemble";

export type TrainRound = {
  round: number;
  apply: boolean;
  cases: {
    family: string;
    expectedFraud: boolean;
    decision: string;
    risk_score: number;
    caught: boolean;
  }[];
  catchRate: number;
  falsePositiveRate: number;
  missed: string[];
  changes: { file: string; applied: boolean; note: string }[];
  engine: string;
};

const STATE_PATH = join(process.cwd(), "ruleset", ".train-state.json");

export async function runTrainingRound(options: {
  apply?: boolean;
  count?: number;
} = {}): Promise<TrainRound> {
  const apply = Boolean(options.apply);
  const batch = generateFraudBatch(options.count ?? 4);
  const analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[] = [];
  let engine = "nemoscantron-local (ruleset mock)";

  for (const generated of batch) {
    const result = await runAnalyze({
      notes: `Red-team family ${generated.family}. Expected fraud=${generated.expectedFraud}.`,
      file: {
        name: `${generated.family}.json`,
        text: JSON.stringify(generated.record),
        mime: "application/json",
      },
    });
    if (!result.ok) {
      analyses.push({
        generated,
        analysis: localAnalyze(generated.record, generated.description),
      });
      continue;
    }
    engine = result.engine;
    analyses.push({ generated, analysis: result.analyses[0] });
  }

  const cases = analyses.map(({ generated, analysis }) => {
    const severe = analysis.decision === "hold" || analysis.decision === "decline";
    const flagged = analysis.decision !== "approve";
    return {
      family: generated.family,
      expectedFraud: generated.expectedFraud,
      decision: analysis.decision,
      risk_score: analysis.risk_score,
      caught: generated.expectedFraud ? flagged : !severe,
    };
  });

  const fraud = cases.filter((item) => item.expectedFraud);
  const clean = cases.filter((item) => !item.expectedFraud);
  const catchRate = fraud.length
    ? Math.round((100 * fraud.filter((item) => item.caught).length) / fraud.length)
    : 0;
  const falsePositiveRate = clean.length
    ? Math.round((100 * clean.filter((item) => !item.caught).length) / clean.length)
    : 0;
  const missed = fraud.filter((item) => !item.caught).map((item) => item.family);

  const round = nextRound();
  const changes = await proposeChanges({
    round,
    apply,
    catchRate,
    falsePositiveRate,
    missed,
    analyses,
  });

  if (apply) writeRound(round);
  return { round, apply, cases, catchRate, falsePositiveRate, missed, changes, engine };
}

async function proposeChanges(args: {
  round: number;
  apply: boolean;
  catchRate: number;
  falsePositiveRate: number;
  missed: string[];
  analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[];
}): Promise<TrainRound["changes"]> {
  const fromModel = await proposeWithModel(args);
  if (fromModel?.length) {
    return fromModel.map((change) => applyMutableChange(change, args.apply));
  }
  return [applyLocalHeuristic(args)];
}

async function proposeWithModel(args: {
  round: number;
  catchRate: number;
  falsePositiveRate: number;
  missed: string[];
  analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[];
}): Promise<{ key: MutableKey; entry: string; summary: string }[] | null> {
  const mutableText = Object.fromEntries(
    (Object.entries(MUTABLE_FILE_BY_KEY) as [MutableKey, string][]).map(([key, file]) => [
      key,
      readFileSync(join(RULESET_DIR, file), "utf8"),
    ]),
  );
  const result = await completeJson<{
    updates?: { key?: MutableKey; entry?: string; summary?: string }[];
  }>({
    system:
      "You are the NemoScantron ruleset trainer. After a red-team round, propose append-only adjustments to MUTABLE rules files 3–7. Never touch CORE files. Return JSON { updates: [{ key, entry, summary }] }. key must be one of velocity_behavioral, geo_device, merchant_auth, attack_patterns, thresholds. entry is one learned-adjustment line.",
    user: JSON.stringify(
      {
        round: args.round,
        catchRate: args.catchRate,
        falsePositiveRate: args.falsePositiveRate,
        missed: args.missed,
        immutableFiles: IMMUTABLE_FILES,
        results: args.analyses.map((item) => ({
          family: item.generated.family,
          expectedFraud: item.generated.expectedFraud,
          decision: item.analysis.decision,
          risk_score: item.analysis.risk_score,
          rules: item.analysis.rules_triggered,
          patterns: item.analysis.patterns_matched,
          reasoning: item.analysis.reasoning,
        })),
        currentRules: Object.fromEntries(
          Object.entries(mutableText).map(([key, text]) => [key, text.slice(0, 1800)]),
        ),
      },
      null,
      2,
    ),
  });
  const updates = result?.data.updates?.filter(
    (item) => item.key && item.entry && item.key in MUTABLE_FILE_BY_KEY,
  );
  if (!updates?.length) return null;
  return updates.map((item) => ({
    key: item.key as MutableKey,
    entry: String(item.entry),
    summary: String(item.summary ?? item.entry),
  }));
}

function applyLocalHeuristic(args: {
  round: number;
  apply: boolean;
  catchRate: number;
  missed: string[];
}): TrainRound["changes"][number] {
  const key: MutableKey = args.missed.includes("geo-impossible-travel")
    ? "geo_device"
    : args.missed.includes("card-testing")
      ? "velocity_behavioral"
      : args.missed.includes("merchant-collusion")
        ? "merchant_auth"
        : args.missed.length
          ? "attack_patterns"
          : "thresholds";
  const entry = `[ROUND ${args.round} | ${args.missed[0] ?? "none"} | catch ${args.catchRate}% | ${
    args.missed.length
      ? `tighten coverage for ${args.missed.join(", ")}`
      : "no missed fraud families this round"
  }]`;
  return applyMutableChange({ key, entry, summary: entry }, args.apply);
}

function applyMutableChange(
  change: { key: MutableKey; entry: string; summary: string },
  apply: boolean,
): TrainRound["changes"][number] {
  const file = MUTABLE_FILE_BY_KEY[change.key];
  if (IMMUTABLE_FILES.includes(file as (typeof IMMUTABLE_FILES)[number])) {
    return { file, applied: false, note: "Refused: CORE files are immutable." };
  }
  if (!apply) {
    return { file, applied: false, note: change.summary };
  }
  const path = join(RULESET_DIR, file);
  let text = readFileSync(path, "utf8");
  text = bumpMetadata(text, change.summary);
  text = appendLearning(text, change.entry);
  writeFileSync(path, text);
  return { file, applied: true, note: change.summary };
}

function bumpMetadata(text: string, summary: string): string {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  return text
    .replace(/(last_updated_round\s*:\s*)(\d+)/, (_, prefix: string, value: string) => {
      return `${prefix}${Number(value) + 1}`;
    })
    .replace(/(last_updated_timestamp\s*:\s*)\S+/, `$1${stamp}`)
    .replace(/(change_summary\s*:\s*).*/, `$1${summary.slice(0, 80)}`)
    .replace(/(red_team_change_rationale\s*:\s*).*/, `$1${summary.slice(0, 80)}`);
}

function appendLearning(text: string, entry: string): string {
  const marker = "— No learnings recorded yet. Round 0 baseline. —";
  const thresholdMarker = "— No threshold adjustments recorded yet. Round 0 baseline. —";
  const patternMarker = "— No learned patterns recorded yet. Round 0 baseline. —";
  if (text.includes(marker)) return text.replace(marker, entry);
  if (text.includes(thresholdMarker)) return text.replace(thresholdMarker, entry);
  if (text.includes(patternMarker)) return text.replace(patternMarker, entry);
  return `${text.trimEnd()}\n\n  ${entry}\n`;
}

function nextRound(): number {
  try {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as { round?: number };
    return (state.round ?? 0) + 1;
  } catch {
    return 1;
  }
}

function writeRound(round: number) {
  mkdirSync(RULESET_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ round }, null, 2));
}
