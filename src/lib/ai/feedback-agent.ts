import { aiStatus, completeJson } from "@/lib/ai/engine";
import { nextRuleId, nearMisses } from "@/lib/pipeline/ruleset";
import type {
  FeedbackProposal,
  PipelineRun,
  Rule,
  RuleSeverity,
  ReasoningStep,
} from "@/lib/pipeline/types";

export async function proposeFeedback(
  run: PipelineRun,
  existing: Rule[],
): Promise<FeedbackProposal[]> {
  if (run.input.source !== "red-team" || !run.input.expectedVerdict) return [];

  const expected = run.input.expectedVerdict;
  const got = run.reasoning.verdict;
  if (expected === got) return [];
  if (expected === "suspicious") return [];

  const missKind = expected === "fraud" && got !== "fraud" ? "false-negative" : "false-positive";
  const fromModel = await proposeWithNemotron(run, existing, missKind);
  if (fromModel) return [fromModel];
  return [proposeLocal(run, existing, missKind)];
}

async function proposeWithNemotron(
  run: PipelineRun,
  existing: Rule[],
  missKind: FeedbackProposal["missKind"],
): Promise<FeedbackProposal | null> {
  const result = await completeJson<{
    reason?: string;
    steps?: { title?: string; detail?: string }[];
    proposedRule?: {
      title?: string;
      policy?: string;
      signals?: string[];
      minHits?: number;
      severity?: RuleSeverity;
    };
  }>({
    system:
      "You are the NemoScantron feedback agent. A red-team case disagreed with Nemotron. Explain the miss in numbered reasoning steps and propose one rule the policy pack should add or narrow. JSON only. Signals must be short phrases that actually appear in the payload and are not already live rules.",
    user: JSON.stringify(
      {
        missKind,
        expected: run.input.expectedVerdict,
        got: run.reasoning.verdict,
        riskScore: run.reasoning.riskScore,
        payload: run.sanitized.text,
        matchedRules: run.reasoning.matchedRules,
        liveRules: existing.map((rule) => ({
          id: rule.id,
          title: rule.title,
          signals: rule.signals,
          minHits: rule.minHits,
        })),
      },
      null,
      2,
    ),
  });
  if (!result?.data.proposedRule?.title || !result.data.proposedRule.signals?.length) {
    return null;
  }
  const proposed = result.data.proposedRule;
  const title = proposed.title;
  if (!title) return null;
  const liveText = run.sanitized.text.toLowerCase();
  const signals = (proposed.signals ?? [])
    .filter((signal) => liveText.includes(signal.toLowerCase()))
    .slice(0, 5);
  if (!signals.length) return null;
  return {
    id: `fb_${crypto.randomUUID().slice(0, 8)}`,
    fromRunId: run.id,
    reason:
      result.data.reason ||
      `Red team labeled ${run.input.expectedVerdict}, Nemotron returned ${run.reasoning.verdict}.`,
    engine: result.engine.label,
    missKind,
    steps: (result.data.steps ?? [])
      .filter((step) => step.title && step.detail)
      .map((step) => ({ title: step.title as string, detail: step.detail as string })),
    proposedRule: {
      id: nextRuleId(title),
      title,
      policy: proposed.policy || `POL-AI: ${title}`,
      signals,
      minHits: Math.min(3, Math.max(1, proposed.minHits ?? 2)),
      severity: proposed.severity ?? (missKind === "false-negative" ? "block" : "watch"),
      enabled: true,
      owner: "policy",
    },
    status: "pending",
  };
}

function proposeLocal(
  run: PipelineRun,
  existing: Rule[],
  missKind: FeedbackProposal["missKind"],
): FeedbackProposal {
  const engine = aiStatus().label;
  const near = nearMisses(run.sanitized.text, existing);

  if (missKind === "false-positive") {
    const noisy = run.reasoning.matchedRules[0];
    const steps: ReasoningStep[] = [
      {
        title: "Compare labels",
        detail: `Red team called this clear. Nemotron returned ${run.reasoning.verdict} at score ${run.reasoning.riskScore}.`,
      },
      {
        title: "Find the hungry rule",
        detail: noisy
          ? `“${noisy.title}” fired on ${noisy.evidence.join(", ")}. That phrasing is too common in ordinary ops files.`
          : "Scoring floor is too aggressive on short operational files.",
      },
      {
        title: "Propose a narrower gate",
        detail: "Raise the hit count so a single everyday token cannot page an analyst.",
      },
    ];
    return {
      id: `fb_${crypto.randomUUID().slice(0, 8)}`,
      fromRunId: run.id,
      engine,
      missKind,
      reason: steps.map((step) => step.detail).join(" "),
      steps,
      proposedRule: {
        id: `narrow-${noisy?.ruleId ?? "floor"}`,
        title: noisy ? `Narrow: ${noisy.title}` : "Raise clear-case floor",
        policy:
          "POL-TUNE-01: Negative-control misses should shrink a rule, not add a new block.",
        signals: noisy?.evidence ?? ["payroll"],
        minHits: noisy ? Math.max(noisy.evidence.length + 1, 3) : 2,
        severity: "watch",
        enabled: true,
        owner: "policy",
      },
      status: "pending",
    };
  }

  const signals = distinctiveSignals(run.sanitized.text, existing);
  const steps: ReasoningStep[] = [
    {
      title: "Compare labels",
      detail: `Red team labeled fraud. Nemotron returned ${run.reasoning.verdict} at score ${run.reasoning.riskScore} with ${run.reasoning.matchedRules.length} rule hit(s).`,
    },
    {
      title: "Inspect near misses",
      detail: near.length
        ? near
            .map(
              (item) =>
                `“${item.title}” had ${item.present.join(", ")} but needed ${item.missing} more signal(s).`,
            )
            .join(" ")
        : "No live rule was even close. This is a coverage hole, not a threshold miss.",
    },
    {
      title: "Extract unused evidence",
      detail: `Phrases in the payload the pack does not score: ${signals.join("; ")}.`,
    },
    {
      title: "Write a policy",
      detail: "Add a block-severity rule so the next replay of this attack dispatches hold/escalate.",
    },
  ];

  const title = titleFor(signals, run.input.redTeam?.family);
  return {
    id: `fb_${crypto.randomUUID().slice(0, 8)}`,
    fromRunId: run.id,
    engine,
    missKind,
    reason: steps.map((step) => step.detail).join(" "),
    steps,
    proposedRule: {
      id: nextRuleId(title),
      title,
      policy: `POL-AI-${run.id.slice(-4).toUpperCase()}: ${title}. Treat this pattern as fraud until dual control clears it.`,
      signals,
      minHits: Math.max(1, Math.min(2, Math.max(signals.length, 1))),
      severity: "block",
      enabled: true,
      owner: "policy",
    },
    status: "pending",
  };
}

function distinctiveSignals(text: string, existing: Rule[]): string[] {
  const known = new Set(
    existing.flatMap((rule) => rule.signals.map((signal) => signal.toLowerCase())),
  );
  const preferred = [
    "principal's office",
    "closing remittance",
    "prior destination is retired",
    "replacement destination",
    "notary window",
    "single-glyph drift",
    "opened this week",
    "junior coordinator",
    "w-9",
    "card they just added",
    "original card was declined",
    "refund tonight",
    "one letter off",
    "lookalike",
    "no billing reference",
  ];
  const lower = text.toLowerCase();
  const hits = preferred.filter((phrase) => lower.includes(phrase) && !known.has(phrase));
  if (hits.length >= 2) return hits.slice(0, 4);

  const tokens = lower
    .split(/[^a-z0-9'$]+/)
    .filter((token) => token.length >= 5)
    .filter((token) => !STOP.has(token));
  const unique = [...new Set(tokens)].filter((token) => !known.has(token));
  return (hits.length ? hits : unique).slice(0, 4);
}

function titleFor(signals: string[], family: string | undefined): string {
  if (family === "lookalike-vendor" || signals.some((s) => s.includes("glyph") || s.includes("w-9"))) {
    return "Lookalike vendor or mule onboarding";
  }
  if (family === "refund-mule" || signals.some((s) => s.includes("refund") || s.includes("card"))) {
    return "Refund onto a stranger rail";
  }
  if (signals.some((s) => s.includes("principal") || s.includes("remittance"))) {
    return "Principal-office remittance with retired destination";
  }
  return "Unscored adversary pattern";
}

const STOP = new Set([
  "please",
  "their",
  "there",
  "about",
  "would",
  "could",
  "should",
  "after",
  "before",
  "because",
  "which",
  "these",
  "those",
  "other",
  "amount",
]);
