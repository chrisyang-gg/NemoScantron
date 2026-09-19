import type {
  ReasoningResult,
  RuleHit,
  SanitizedInput,
  ScanInput,
  Verdict,
} from "@/lib/pipeline/types";
import { defaultWorkflow } from "@/lib/data/default-rules";

const ENGINE = "nemoscantron-local (Nemotron-compatible schema)";

export function reasonWithNemotron(args: {
  input: ScanInput;
  sanitized: SanitizedInput;
  hits: RuleHit[];
}): ReasoningResult {
  const { input, sanitized, hits } = args;
  const prompt = input.prompt.trim() || "Score this payload for payment fraud.";

  const block = hits.filter((h) => h.severity === "block").length;
  const flag = hits.filter((h) => h.severity === "flag").length;
  const watch = hits.filter((h) => h.severity === "watch").length;
  const injection = sanitized.warnings.filter((w) =>
    w.toLowerCase().includes("injection"),
  ).length;

  let riskScore = Math.min(
    100,
    block * 38 + flag * 18 + watch * 10 + injection * 12 + (sanitized.text ? 4 : 0),
  );

  if (!sanitized.text) riskScore = 8;
  if (hits.length === 0 && sanitized.text.split(/\s+/).length < 12) riskScore = 12;

  const verdict: Verdict =
    riskScore >= 75 ? "fraud" : riskScore >= 40 ? "suspicious" : "clear";

  const confidence =
    hits.length === 0
      ? verdict === "clear"
        ? 0.62
        : 0.48
      : Math.min(0.97, 0.55 + hits.length * 0.12 + block * 0.08);

  const steps = [
    {
      title: "Read sanitized intake",
      detail: `${sanitized.originalChars} chars in, ${sanitized.text.length} after sanitizing. ${sanitized.warnings.length} warning(s).`,
    },
    {
      title: "Bind policies and workflow",
      detail: `${defaultWorkflow.name}: ${hits.length} rule hit(s) across the active policy pack.`,
    },
    {
      title: "Weigh evidence",
      detail:
        hits.length === 0
          ? "No policy signals fired. Residual risk comes from size, warnings, and prompt context."
          : hits
              .map(
                (hit) =>
                  `${hit.title} (${hit.severity}) on ${hit.evidence.join(", ")}`,
              )
              .join(" · "),
    },
    {
      title: "Form verdict",
      detail: `Analyst asked: “${prompt}” → ${verdict} at risk ${riskScore}.`,
    },
  ];

  const summary = summarize(verdict, hits, riskScore, prompt);

  return {
    engine: ENGINE,
    verdict,
    riskScore,
    confidence: Number(confidence.toFixed(2)),
    summary,
    steps,
    matchedRules: hits,
  };
}

function summarize(
  verdict: Verdict,
  hits: RuleHit[],
  riskScore: number,
  prompt: string,
): string {
  if (verdict === "clear") {
    return `No blocking policy fired. Treat as routine unless a human still wants a second look. Prompt: ${prompt}`;
  }
  if (verdict === "suspicious") {
    return `Partial policy overlap (${hits.map((h) => h.title).join("; ") || "weak signals"}). Hold for an analyst before money moves.`;
  }
  return `High-confidence fraud pattern (score ${riskScore}). Strongest hits: ${
    hits
      .filter((h) => h.severity === "block")
      .map((h) => h.title)
      .join("; ") || hits.map((h) => h.title).join("; ")
  }.`;
}
