import { FAMILY_CATEGORIES, type RedTeamFamily } from "@/lib/red-team/families";
import { MUTABLE_KEYS, type MutableKey } from "@/lib/ruleset/order";
import type { NemotronAnalysis } from "@/lib/nemotron/types";

const RULE_PREFIX: Record<string, MutableKey> = {
  VB: "velocity_behavioral",
  GEO: "geo_device",
  MA: "merchant_auth",
};

export function clampTestCount(value: unknown, fallback = 4): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(10, Math.round(n)));
}

export function categoriesForFamily(family: string): MutableKey[] {
  if (family in FAMILY_CATEGORIES) {
    return [...FAMILY_CATEGORIES[family as RedTeamFamily]];
  }
  return ["attack_patterns"];
}

export function categoriesFromScore(analysis: NemotronAnalysis): MutableKey[] {
  const keys = new Set<MutableKey>();
  for (const rule of analysis.rules_triggered) {
    const prefix = rule.split("-")[0];
    const key = RULE_PREFIX[prefix ?? ""];
    if (key) keys.add(key);
  }
  if (analysis.patterns_matched.length) keys.add("attack_patterns");
  return [...keys];
}

export function keysNeedingAttention(args: {
  family: string;
  goldCategories: MutableKey[];
  expectedFraud: boolean;
  expectedDecision: string;
  analysis: NemotronAnalysis;
}): MutableKey[] {
  const keys = new Set<MutableKey>([
    ...args.goldCategories,
    ...categoriesForFamily(args.family),
    ...categoriesFromScore(args.analysis),
  ]);
  const scored = args.analysis.decision;
  const mismatch = scored !== args.expectedDecision;
  const missedFraud = args.expectedFraud && scored === "approve";
  const falsePositive = !args.expectedFraud && (scored === "hold" || scored === "decline");
  if (mismatch || missedFraud || falsePositive) {
    keys.add("thresholds");
    keys.add("attack_patterns");
  }
  return MUTABLE_KEYS.filter((key) => keys.has(key));
}

export function caseNeedsAttention(args: {
  expectedFraud: boolean;
  expectedDecision: string;
  analysis: NemotronAnalysis;
}): boolean {
  if (args.analysis.decision !== args.expectedDecision) return true;
  if (args.expectedFraud && args.analysis.decision === "approve") return true;
  if (!args.expectedFraud && (args.analysis.decision === "hold" || args.analysis.decision === "decline")) {
    return true;
  }
  return false;
}
