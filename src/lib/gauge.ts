/**
 * Fraudometer color bands. Edit these to move green / amber / red.
 * Not exposed in the UI.
 *
 * 0 … safeMax        → green  (safe)
 * safeMax+1 … maybeMax → amber (maybe)
 * maybeMax+1 … 100   → red    (unsafe)
 */
export const GAUGE_BANDS = {
  safeMax: 39,
  maybeMax: 74,
} as const;

export const GAUGE_COLORS = {
  safe: "#4ade80",
  maybe: "#fbbf24",
  unsafe: "#f87171",
  track: "rgba(196, 181, 253, 0.16)",
} as const;

export type GaugeBand = "safe" | "maybe" | "unsafe";

export function bandFor(score: number): GaugeBand {
  const clamped = clampScore(score);
  if (clamped <= GAUGE_BANDS.safeMax) return "safe";
  if (clamped <= GAUGE_BANDS.maybeMax) return "maybe";
  return "unsafe";
}

export function colorFor(score: number): string {
  return GAUGE_COLORS[bandFor(score)];
}

export function labelFor(score: number): string {
  const band = bandFor(score);
  if (band === "safe") return "Safe";
  if (band === "maybe") return "Maybe";
  return "Unsafe";
}

export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToAngle(score: number): number {
  return 180 - 180 * (clampScore(score) / 100);
}
