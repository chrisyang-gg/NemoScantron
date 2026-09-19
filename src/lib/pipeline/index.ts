import { proposeFeedback } from "@/lib/pipeline/feedback";
import { dispatchWithNemo } from "@/lib/pipeline/execute";
import { reasonWithNemotron } from "@/lib/pipeline/reasoning";
import { matchRules } from "@/lib/pipeline/ruleset";
import { sanitizeInput } from "@/lib/pipeline/sanitize";
import { addProposals, addRun, getStore } from "@/lib/pipeline/store";
import type { PipelineRun, ScanInput, SourceKind, Verdict } from "@/lib/pipeline/types";

export type RunRequest = {
  source: SourceKind;
  prompt: string;
  rawText: string;
  filename?: string;
  expectedVerdict?: Verdict;
};

export function runPipeline(request: RunRequest): PipelineRun {
  const started = Date.now();
  const input: ScanInput = {
    id: `in_${crypto.randomUUID().slice(0, 8)}`,
    source: request.source,
    filename: request.filename,
    prompt: request.prompt,
    rawText: request.rawText,
    expectedVerdict: request.expectedVerdict,
    createdAt: new Date().toISOString(),
  };

  const sanitized = sanitizeInput(input);
  const hits = matchRules(sanitized.text, getStore().rules);
  const reasoning = reasonWithNemotron({ input, sanitized, hits });
  const actions = dispatchWithNemo(reasoning, input.source);

  const run: PipelineRun = {
    id: `run_${crypto.randomUUID().slice(0, 8)}`,
    input,
    sanitized,
    reasoning,
    actions,
    metrics: {
      riskScore: reasoning.riskScore,
      ruleHits: hits.length,
      latencyMs: Date.now() - started,
      description: reasoning.summary,
    },
    feedback: [],
  };

  run.feedback = proposeFeedback(run, getStore().rules);
  addRun(run);
  addProposals(run.feedback);
  return run;
}
