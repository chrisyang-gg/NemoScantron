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

export type RuleFamily = "velocity" | "geo" | "merchant" | "attack" | "threshold" | "other";

export const RULE_FAMILY_META: Record<RuleFamily, { label: string; hue: number }> = {
  velocity: { label: "Velocity / behavioral", hue: 32 },
  geo: { label: "Geo / device", hue: 196 },
  merchant: { label: "Merchant / auth", hue: 328 },
  attack: { label: "Attack pattern", hue: 4 },
  threshold: { label: "Threshold", hue: 52 },
  other: { label: "Other rule", hue: 262 },
};

export function ruleName(id: string): string {
  return RULE_META.find((item) => item.id === id)?.name ?? id;
}

export function ruleHover(id: string, count: number) {
  if (count <= 0) return null;
  return { id, name: ruleName(id), count };
}

export function ruleFamily(id: string): RuleFamily {
  const key = id.trim().toUpperCase();
  if (key.startsWith("VB")) return "velocity";
  if (key.startsWith("GEO") && !key.includes("IMPOSSIBLE")) return "geo";
  if (key.startsWith("MA")) return "merchant";
  if (key.startsWith("TH")) return "threshold";
  if (
    key.startsWith("AP") ||
    key.includes("PATTERN") ||
    key.includes("CARD-TESTING") ||
    key.includes("IMPOSSIBLE")
  ) {
    return "attack";
  }
  return "other";
}

export function ruleHue(id: string): number {
  const base = RULE_FAMILY_META[ruleFamily(id)].hue;
  const digits = id.match(/(\d+)/);
  const n = digits ? Number(digits[1]) : [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (base + ((n * 13) % 21) - 10 + 360) % 360;
}
