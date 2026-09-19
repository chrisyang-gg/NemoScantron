import { nextRuleId } from "@/lib/pipeline/ruleset";
import type { FeedbackProposal, PipelineRun, Rule } from "@/lib/pipeline/types";

export function proposeFeedback(run: PipelineRun, existing: Rule[]): FeedbackProposal[] {
  if (run.input.source !== "red-team" || !run.input.expectedVerdict) return [];

  const expected = run.input.expectedVerdict;
  const got = run.reasoning.verdict;

  if (expected === "fraud" && got !== "fraud") {
    const signals = distinctiveSignals(run.sanitized.text, existing);
    const proposed: Rule = {
      id: nextRuleId(signals[0] ? `lookalike-${signals[0]}` : `miss-${run.id}`),
      title: "Lookalike vendor or mule onboarding",
      policy:
        "POL-VENDOR-15: One-letter vendor mismatches, brand-new accounts, and intern-only approval are fraud until proven otherwise.",
      signals: signals.length ? signals : ["lookalike", "one letter off", "opened 3 days ago"],
      minHits: Math.min(2, Math.max(1, signals.length)),
      severity: "block",
      enabled: true,
      owner: "policy",
    };

    return [
      {
        id: `fb_${crypto.randomUUID().slice(0, 8)}`,
        fromRunId: run.id,
        reason: `Red team labeled this ${expected}, Nemotron returned ${got} (score ${run.reasoning.riskScore}). The ruleset never scored the vendor-name mismatch or fresh-account mule pattern.`,
        proposedRule: proposed,
        status: "pending",
      },
    ];
  }

  if (expected === "clear" && got !== "clear") {
    const noisy = run.reasoning.matchedRules[0];
    return [
      {
        id: `fb_${crypto.randomUUID().slice(0, 8)}`,
        fromRunId: run.id,
        reason: `Red team labeled this clear, but the bench scored ${got}. ${
          noisy
            ? `“${noisy.title}” may be too broad (${noisy.evidence.join(", ")}).`
            : "Tighten the scoring floor for short operational files."
        }`,
        proposedRule: {
          id: `narrow-${noisy?.ruleId ?? "floor"}`,
          title: noisy ? `Narrow: ${noisy.title}` : "Raise clear-case floor",
          policy:
            "POL-TUNE-01: Negative-control misses should shrink a rule, not add a new block.",
          signals: noisy?.evidence ?? ["payroll"],
          minHits: (noisy ? 3 : 2),
          severity: "watch",
          enabled: true,
          owner: "policy",
        },
        status: "pending",
      },
    ];
  }

  return [];
}

function distinctiveSignals(text: string, existing: Rule[]): string[] {
  const known = new Set(
    existing.flatMap((rule) => rule.signals.map((s) => s.toLowerCase())),
  );
  const candidates = [
    "one letter off",
    "lookalike",
    "opened 3 days ago",
    "intern",
    "w-9",
    "contractor payout",
    "no invoice number",
  ];
  const lower = text.toLowerCase();
  return candidates.filter((c) => lower.includes(c) && !known.has(c)).slice(0, 4);
}
