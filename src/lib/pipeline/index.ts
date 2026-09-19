import { proposeFeedback } from "@/lib/ai/feedback-agent";
import { runAnalyze } from "@/lib/nemotron/run-analyze";
import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { dispatchWithNemo } from "@/lib/pipeline/execute";
import { sanitizeInput } from "@/lib/pipeline/sanitize";
import { addProposals, addRun, getStore } from "@/lib/pipeline/store";
import type {
  GeneratedAttack,
  PipelineRun,
  ReasoningResult,
  ScanInput,
  SourceKind,
  Verdict,
} from "@/lib/pipeline/types";

export type RunRequest = {
  source: SourceKind;
  prompt: string;
  rawText: string;
  filename?: string;
  expectedVerdict?: Verdict;
  redTeam?: ScanInput["redTeam"];
};

export async function runPipeline(request: RunRequest): Promise<PipelineRun> {
  const started = Date.now();
  const input: ScanInput = {
    id: `in_${crypto.randomUUID().slice(0, 8)}`,
    source: request.source,
    filename: request.filename,
    prompt: request.prompt,
    rawText: request.rawText,
    expectedVerdict: request.expectedVerdict,
    createdAt: new Date().toISOString(),
    redTeam: request.redTeam,
  };

  const analyzed = await runAnalyze({
    notes: request.prompt,
    file: {
      name: request.filename || "payload.json",
      text: request.rawText,
      mime: "application/json",
    },
  });
  if (!analyzed.ok) {
    throw new Error(analyzed.error);
  }

  const primary = analyzed.analyses[0];
  input.rawText = request.rawText;
  const sanitized = sanitizeInput(input);
  if (analyzed.droppedFields.length) {
    sanitized.stripped.push(
      `${analyzed.droppedFields.length} extra field(s) not in the credit-card schema`,
    );
    sanitized.warnings.push(
      `Removed fields before Nemotron: ${analyzed.droppedFields.slice(0, 8).join(", ")}.`,
    );
  }
  const reasoning = reasoningFromNemotron(primary, analyzed.engine);
  const actions = dispatchWithNemo(reasoning, input.source);

  const run: PipelineRun = {
    id: `run_${crypto.randomUUID().slice(0, 8)}`,
    input,
    sanitized,
    reasoning,
    actions,
    metrics: {
      riskScore: reasoning.riskScore,
      ruleHits: primary.rules_triggered.length,
      latencyMs: Date.now() - started,
      description: reasoning.summary,
    },
    feedback: [],
  };

  run.feedback = await proposeFeedback(run, getStore().rules);
  addRun(run);
  addProposals(run.feedback);
  return run;
}

function reasoningFromNemotron(analysis: NemotronAnalysis, engine: string): ReasoningResult {
  const verdict: Verdict =
    analysis.decision === "approve"
      ? "clear"
      : analysis.decision === "flag_for_review"
        ? "suspicious"
        : "fraud";
  return {
    engine,
    verdict,
    riskScore: Math.round(analysis.risk_score * 100),
    confidence: Math.round(analysis.confidence * 100),
    summary: analysis.reasoning,
    steps: [
      { title: "Nemotron decision", detail: analysis.decision },
      { title: "Recommended action", detail: analysis.recommended_action },
    ],
    matchedRules: analysis.rules_triggered.map((id) => ({
      ruleId: id,
      title: id,
      severity: "flag",
      policy: id,
      evidence: [id],
    })),
    explanation: {
      headline: analysis.decision,
      body: analysis.reasoning,
      findings: analysis.fraud_indicators.map((item) => ({
        title: item.indicator,
        severity: item.severity === "critical" || item.severity === "high" ? "block" : "flag",
        policy: item.indicator,
        evidence: [item.detail],
        why: item.detail,
      })),
    },
  };
}

export function runRequestFromAttack(event: GeneratedAttack): RunRequest {
  return {
    source: "red-team",
    prompt: event.prompt,
    rawText: event.body,
    filename: event.filename,
    expectedVerdict: event.expectedVerdict,
    redTeam: {
      family: event.family,
      name: event.name,
      attackPlan: event.attackPlan,
      engine: event.engine,
    },
  };
}
