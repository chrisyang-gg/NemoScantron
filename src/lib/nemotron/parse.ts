import {
  DECISIONS,
  type NemotronAnalysis,
  type NemotronDecision,
} from "@/lib/nemotron/types";

export function parseNemotronOutput(raw: string): NemotronAnalysis[] {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  const start =
    startArr >= 0 && (startObj < 0 || startArr < startObj) ? startArr : startObj;
  const endObj = cleaned.lastIndexOf("}");
  const endArr = cleaned.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (start < 0 || end <= start) {
    throw new Error("Nemotron did not return JSON.");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.map(normalizeAnalysis);
}

function normalizeAnalysis(value: unknown): NemotronAnalysis {
  if (!isRecord(value)) throw new Error("Nemotron output is not an object.");
  const decision = String(value.decision ?? "");
  if (!DECISIONS.includes(decision as NemotronDecision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }
  const breakdown = isRecord(value.risk_score_breakdown) ? value.risk_score_breakdown : {};
  const versions = isRecord(value.ruleset_versions_applied)
    ? value.ruleset_versions_applied
    : {};
  const indicators = Array.isArray(value.fraud_indicators)
    ? value.fraud_indicators.filter(isRecord).map((item) => ({
        indicator: String(item.indicator ?? "signal"),
        severity: normalizeSeverity(item.severity),
        detail: String(item.detail ?? ""),
      }))
    : [];

  return {
    transaction_id: String(value.transaction_id ?? "unknown"),
    analysis_timestamp: String(value.analysis_timestamp ?? new Date().toISOString()),
    risk_score: clamp01(value.risk_score),
    decision: decision as NemotronDecision,
    confidence: clamp01(value.confidence),
    rules_triggered: stringArray(value.rules_triggered),
    patterns_matched: stringArray(value.patterns_matched),
    fraud_indicators: indicators,
    risk_score_breakdown: {
      velocity_behavioral: clamp01(breakdown.velocity_behavioral),
      geo_device: clamp01(breakdown.geo_device),
      merchant_auth: clamp01(breakdown.merchant_auth),
      pattern_boost: Math.min(0.35, clamp01(breakdown.pattern_boost)),
    },
    reasoning: String(value.reasoning ?? ""),
    recommended_action: String(value.recommended_action ?? ""),
    escalate_to_analyst: Boolean(value.escalate_to_analyst),
    ruleset_versions_applied: {
      velocity_behavioral: String(versions.velocity_behavioral ?? "v1.0"),
      geo_device: String(versions.geo_device ?? "v1.0"),
      merchant_auth: String(versions.merchant_auth ?? "v1.0"),
      attack_patterns: String(versions.attack_patterns ?? "v1.0"),
      thresholds: String(versions.thresholds ?? "v1.0"),
    },
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function clamp01(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

function normalizeSeverity(value: unknown): FraudIndicatorSeverity {
  const text = String(value ?? "medium");
  if (text === "low" || text === "medium" || text === "high" || text === "critical") {
    return text;
  }
  return "medium";
}

type FraudIndicatorSeverity = "low" | "medium" | "high" | "critical";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
