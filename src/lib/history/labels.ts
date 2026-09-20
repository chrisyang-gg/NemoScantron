const DECISION_PAST_TENSE: Record<string, string> = {
  approve: "approved",
  decline: "declined",
  hold: "held",
  flag_for_review: "flagged for review",
};

export function decisionPastTense(decision: string) {
  return DECISION_PAST_TENSE[decision] ?? decision.replaceAll("_", " ");
}

export type MapTone = "normal" | "suspicious" | "malicious";

export function mapTone(event: {
  decision: string;
  risk_score: number;
  rules_triggered: string[];
}): MapTone {
  if (event.decision === "decline" || event.risk_score >= 0.75) return "malicious";
  if (
    event.decision === "hold" ||
    event.decision === "flag_for_review" ||
    event.risk_score >= 0.4 ||
    event.rules_triggered.length > 0
  ) {
    return "suspicious";
  }
  return "normal";
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function atRiskLabel(amount: number) {
  return `${formatMoney(amount)} at Risk`;
}
