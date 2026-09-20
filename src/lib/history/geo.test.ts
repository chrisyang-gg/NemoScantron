import { resolvePlace, samePoint } from "./geo";
import { eventFrom } from "./store";
import type { NemotronAnalysis } from "../nemotron/types";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const lagos = resolvePlace({ city: "Lagos", country: "NG" });
const us = resolvePlace({ country: "US" });
assert(lagos && us && !samePoint(lagos, us), "US and Lagos must differ");
assert(lagos && Math.abs(lagos.lat - 6.52) < 0.2, "Lagos lat");

const analysis = {
  transaction_id: "txn_88213",
  analysis_timestamp: "2026-09-19T14:02:11Z",
  risk_score: 0.88,
  decision: "decline",
  confidence: 0.9,
  rules_triggered: ["GEO-001"],
  patterns_matched: [],
  fraud_indicators: [],
  risk_score_breakdown: {
    velocity_behavioral: 0,
    geo_device: 1,
    merchant_auth: 0,
    pattern_boost: 0,
  },
  reasoning: "",
  recommended_action: "",
  escalate_to_analyst: true,
  ruleset_versions_applied: {
    velocity_behavioral: "v1.0",
    geo_device: "v1.0",
    merchant_auth: "v1.0",
    attack_patterns: "v1.0",
    thresholds: "v1.0",
  },
} as NemotronAnalysis;

const event = eventFrom(
  analysis,
  {
    timestamp: "2026-09-19T14:02:11Z",
    amount: 842.5,
    account: { billing_country: "US" },
    merchant: { merchant_city: "Lagos", merchant_country: "NG", merchant_risk_score: 0.58 },
    location: { transaction_city: "Lagos", transaction_country: "NG" },
  },
  "2026-09-19T20:00:00Z",
);
assert(event.origin_country === "US", "billing origin");
assert(event.country === "NG" && event.city === "Lagos", "dest");

console.log("geo tests passed");
