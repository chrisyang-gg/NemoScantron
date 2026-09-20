export const RULE_META = [
  { id: "VB-001", name: "High transaction frequency — last hour" },
  { id: "VB-002", name: "Large amount deviation from baseline" },
  { id: "VB-003", name: "Rapid cumulative spend — last 24 hours" },
  { id: "VB-004", name: "High merchant diversity — last 24 hours" },
  { id: "VB-005", name: "Declined authorization attempts — last hour" },
  { id: "VB-006", name: "Newly activated card" },
  { id: "VB-007", name: "Newly opened account" },
  { id: "VB-008", name: "Multi-country activity — last 24 hours" },
  { id: "GEO-001", name: "Impossible travel speed" },
  { id: "GEO-002", name: "High-risk country" },
  { id: "GEO-003", name: "First use in country" },
  { id: "GEO-004", name: "Unknown device" },
  { id: "GEO-005", name: "IP / billing country mismatch" },
  { id: "GEO-006", name: "Distance from home" },
  { id: "GEO-007", name: "Shared or risky device" },
  { id: "MA-001", name: "High-risk merchant" },
  { id: "MA-002", name: "First-time merchant" },
  { id: "MA-003", name: "High-risk MCC" },
  { id: "MA-004", name: "Unusual merchant category" },
  { id: "MA-005", name: "CVV mismatch" },
  { id: "MA-006", name: "CVV not provided" },
  { id: "MA-007", name: "AVS full mismatch" },
  { id: "MA-008", name: "AVS not checked" },
  { id: "MA-009", name: "3-D Secure missing" },
  { id: "MA-010", name: "PIN not verified" },
] as const;

export const RULE_IDS = RULE_META.map((item) => item.id);

export function ruleName(id: string): string {
  return RULE_META.find((item) => item.id === id)?.name ?? id;
}
