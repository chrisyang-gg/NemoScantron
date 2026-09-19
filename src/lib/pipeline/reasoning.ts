import type {
  ReasoningResult,
  RuleHit,
  RuleSeverity,
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

  if (block >= 1) riskScore = Math.max(riskScore, 82);
  if (flag >= 1 && block === 0) riskScore = Math.max(riskScore, 48);
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

  const summary = summarize(verdict, hits, riskScore);
  const explanation = explain(verdict, hits, riskScore, confidence, sanitized);

  return {
    engine: ENGINE,
    verdict,
    riskScore,
    confidence: Number(confidence.toFixed(2)),
    summary,
    steps,
    matchedRules: hits,
    explanation,
  };
}

function summarize(verdict: Verdict, hits: RuleHit[], riskScore: number): string {
  if (verdict === "clear") {
    return "No blocking policy fired. Treat as routine unless a human still wants a second look.";
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

function explain(
  verdict: Verdict,
  hits: RuleHit[],
  riskScore: number,
  confidence: number,
  sanitized: SanitizedInput,
): ReasoningResult["explanation"] {
  const findings = hits.map((hit) => ({
    title: hit.title,
    severity: hit.severity,
    policy: hit.policy,
    evidence: hit.evidence,
    why: whyFor(hit),
  }));

  if (verdict === "clear") {
    return {
      headline: "Not treated as fraud",
      body:
        hits.length === 0
          ? `The history scored ${riskScore} of 100. Nothing in the text matched a live fraud policy (executive urgency, payment-destination change, irreversible rails, secrecy pressure, duplicates, or after-hours international movement). Residual risk is only the size of the file and ordinary wording, so Nemotron leaves it clear.`
          : `The history scored ${riskScore} of 100. Watch-level signals appeared, but nothing reached a block. That is below the fraud line (75) and the suspicious line (40), so it stays clear.`,
      findings,
    };
  }

  if (verdict === "suspicious") {
    return {
      headline: "Suspected — not confirmed fraud",
      body: `The history scored ${riskScore} of 100 (confidence ${Math.round(confidence * 100)}%). At least one policy overlapped, but not strongly enough to call it fraud. Money should not move until an analyst dual-controls the ${findings.length} finding${findings.length === 1 ? "" : "s"} below. Each one is a reason this looks like social engineering or a payment redirect, even if no single hit is decisive.`,
      findings,
    };
  }

  const blocks = findings.filter((f) => f.severity === "block");
  const quoted = hits.flatMap((h) => h.evidence).slice(0, 6);
  const warn = sanitized.warnings.length
    ? ` Sanitizer also raised ${sanitized.warnings.length} warning(s), which adds weight.`
    : "";

  return {
    headline: "Suspected as fraud",
    body: `The history scored ${riskScore} of 100 with ${Math.round(confidence * 100)}% confidence, which sits in the fraud band (75–100). ${blocks.length} blocking polic${blocks.length === 1 ? "y" : "ies"} fired${quoted.length ? ` on wording such as “${quoted.join("”, “")}”` : ""}. Those patterns — urgency from an executive, a last-minute destination change, an irreversible rail, or an instruction to hide the payment — are how business-email compromise and vendor-redirect fraud actually show up in AP files. Nemotron treats the combination as enough to hold funds and escalate; it is not waiting for a perfect signature.${warn} Detail on each hit follows.`,
    findings,
  };
}

function whyFor(hit: RuleHit): string {
  const quotes = hit.evidence.map((item) => `“${item}”`).join(", ");
  const known: Record<string, string> = {
    "ceo-urgency-wire": `A same-day outbound payment dressed as an executive order is the core BEC pattern. The file uses ${quotes}, which is enough for POL-WIRE-04. Real CEOs do not bypass dual control by email; attackers do. That is why this alone can put the score into fraud.`,
    "payment-channel-shift": `The payee or rail changed in the same breath as the request to pay. The file uses ${quotes}. POL-BEC-11 exists because “our banking was updated, do not use the old account” is how invoice-redirect fraud steals the next AP run. A new destination without a second channel of confirmation is treated as hostile.`,
    "gift-card-or-crypto": `Gift cards and crypto cannot be clawed back. The file uses ${quotes}. POL-RAIL-02 bans those rails for vendor payment because once the codes or the txid leave the building the money is gone. Asking for them is itself evidence of fraud, not a fallback option.`,
    "secrecy-pressure": `The sender is isolating the operator from the usual approvers. The file uses ${quotes}. POL-SOCENG-07 reads that as social engineering: fraudsters need the victim not to call finance. Confidentiality theater around a payment is a reason to stop, not to hurry.`,
    "invoice-reuse": `The same invoice or a “resubmit” showing up twice is how duplicate payments and recycled intercepts get through. The file uses ${quotes}. POL-DUP-03 wants a human to check whether this amount already left.`,
    "after-hours-international": `Large movement asked for outside the business window, or into a high-risk corridor, is a watch. The file uses ${quotes}. POL-GEO-09 does not auto-block, but stacked with other hits it supports a fraud call.`,
  };
  return (
    known[hit.ruleId] ??
    `“${hit.title}” fired because the history contains ${quotes}. ${hit.policy} That is a ${severityLabel(hit.severity)} signal: it is one of the reasons this file is not being treated as ordinary AP.`
  );
}

function severityLabel(severity: RuleSeverity): string {
  if (severity === "block") return "blocking";
  if (severity === "flag") return "elevated";
  return "watch-level";
}
