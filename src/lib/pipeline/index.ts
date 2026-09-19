import { proposeFeedback } from "@/lib/ai/feedback-agent";
import { dispatchWithNemo } from "@/lib/pipeline/execute";
import { reasonWithNemotron } from "@/lib/pipeline/reasoning";
import { matchRules } from "@/lib/pipeline/ruleset";
import { sanitizeInput } from "@/lib/pipeline/sanitize";
import {
  isJsonFilename,
  parseJsonFile,
  sanitizeCreditCardJson,
  stringifySanitizedRecords,
} from "@/lib/pipeline/schema-sanitize";
import { addProposals, addRun, getStore } from "@/lib/pipeline/store";
import type {
  GeneratedAttack,
  PipelineRun,
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

  const prepared = prepareJsonAgainstSchema(input.rawText, input.filename);
  input.rawText = prepared.text;
  const sanitized = sanitizeInput(input);
  if (prepared.dropped.length) {
    sanitized.stripped.push(
      `${prepared.dropped.length} extra field(s) not in the credit-card schema`,
    );
    sanitized.warnings.push(
      `Removed fields before scoring: ${prepared.dropped.slice(0, 8).join(", ")}.`,
    );
  }
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

  run.feedback = await proposeFeedback(run, getStore().rules);
  addRun(run);
  addProposals(run.feedback);
  return run;
}

function prepareJsonAgainstSchema(
  rawText: string,
  filename?: string,
): { text: string; dropped: string[] } {
  const looksJson = filename ? isJsonFilename(filename) : rawText.trim().startsWith("{") || rawText.trim().startsWith("[");
  if (!looksJson) return { text: rawText, dropped: [] };

  const parsed = parseJsonFile(rawText);
  if (!parsed.ok) return { text: rawText, dropped: [] };

  const sanitized = sanitizeCreditCardJson(parsed.value);
  if (!sanitized.ok) {
    if (filename && isJsonFilename(filename)) {
      throw new Error(sanitized.error);
    }
    return { text: rawText, dropped: [] };
  }

  return {
    text: stringifySanitizedRecords(sanitized.records),
    dropped: sanitized.dropped,
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
