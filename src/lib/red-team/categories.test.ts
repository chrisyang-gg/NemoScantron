import { caseNeedsAttention, clampTestCount, keysNeedingAttention } from "./categories";
import type { NemotronAnalysis } from "../nemotron/types";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(clampTestCount(0) === 1, "min 1");
assert(clampTestCount(11) === 10, "max 10");
assert(clampTestCount(4) === 4, "passthrough");
assert(clampTestCount("nope") === 4, "fallback");

const miss: NemotronAnalysis = {
  transaction_id: "x",
  analysis_timestamp: "2026-09-19T00:00:00Z",
  risk_score: 0.1,
  decision: "approve",
  confidence: 0.4,
  rules_triggered: [],
  patterns_matched: [],
  fraud_indicators: [],
  risk_score_breakdown: {
    velocity_behavioral: 0,
    geo_device: 0,
    merchant_auth: 0,
    pattern_boost: 0,
  },
  reasoning: "",
  recommended_action: "",
  escalate_to_analyst: false,
  ruleset_versions_applied: {
    velocity_behavioral: "v1.0",
    geo_device: "v1.0",
    merchant_auth: "v1.0",
    attack_patterns: "v1.0",
    thresholds: "v1.0",
  },
};

assert(caseNeedsAttention({ expectedFraud: true, expectedDecision: "decline", analysis: miss }), "miss needs attention");
const keys = keysNeedingAttention({
  family: "card-testing",
  goldCategories: ["velocity_behavioral"],
  expectedFraud: true,
  expectedDecision: "decline",
  analysis: miss,
});
assert(keys.includes("velocity_behavioral"), "gold category kept");
assert(keys.includes("thresholds"), "mismatch adds thresholds");
assert(keys.includes("attack_patterns"), "miss adds patterns");

const hit = { ...miss, decision: "decline" as const, risk_score: 0.9 };
assert(!caseNeedsAttention({ expectedFraud: true, expectedDecision: "decline", analysis: hit }), "match is quiet");

console.log("category tests passed");
