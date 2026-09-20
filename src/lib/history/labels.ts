const DECISION_PAST_TENSE: Record<string, string> = {
  approve: "approved",
  decline: "declined",
  hold: "held",
  flag_for_review: "flagged for review",
};

export function decisionPastTense(decision: string) {
  return DECISION_PAST_TENSE[decision] ?? decision.replaceAll("_", " ");
}
