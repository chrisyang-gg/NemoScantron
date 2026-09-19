export const DECISIONS = ["approve", "flag_for_review", "hold", "decline"] as const;
export type NemotronDecision = (typeof DECISIONS)[number];

export type FraudIndicator = {
  indicator: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
};

export type RiskBreakdown = {
  velocity_behavioral: number;
  geo_device: number;
  merchant_auth: number;
  pattern_boost: number;
};

export type RulesetVersions = {
  velocity_behavioral: string;
  geo_device: string;
  merchant_auth: string;
  attack_patterns: string;
  thresholds: string;
};

export type NemotronAnalysis = {
  transaction_id: string;
  analysis_timestamp: string;
  risk_score: number;
  decision: NemotronDecision;
  confidence: number;
  rules_triggered: string[];
  patterns_matched: string[];
  fraud_indicators: FraudIndicator[];
  risk_score_breakdown: RiskBreakdown;
  reasoning: string;
  recommended_action: string;
  escalate_to_analyst: boolean;
  ruleset_versions_applied: RulesetVersions;
};

export type AnalyzeSuccess = {
  ok: true;
  analyses: NemotronAnalysis[];
  engine: string;
  usedMock: boolean;
  droppedFields: string[];
  filename?: string;
};

export type AnalyzeFailure = {
  ok: false;
  error: string;
};

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeFailure;
