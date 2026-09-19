import { assemblePrompt, readRulesetMetadataVersions } from "@/lib/ruleset/assemble";
import { callNemotron, nemotronStatus } from "@/lib/nemotron/call";
import { localAnalyze } from "@/lib/nemotron/local-analyze";
import { parseNemotronOutput } from "@/lib/nemotron/parse";
import { prepareRecords, type AnalyzeInput } from "@/lib/nemotron/intake";
import type { AnalyzeResponse } from "@/lib/nemotron/types";

export type { AnalyzeInput };

export async function runAnalyze(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const intake = prepareRecords(input);
  if (!intake.ok) return intake;

  const versions = readRulesetMetadataVersions();
  const status = nemotronStatus();
  if (status.live) {
    try {
      const prompt = assemblePrompt(intake.records, intake.notes);
      const raw = await callNemotron(prompt);
      if (raw) {
        return {
          ok: true,
          analyses: parseNemotronOutput(raw),
          engine: status.label,
          usedMock: false,
          droppedFields: intake.dropped,
          filename: intake.filename,
        };
      }
    } catch {
      // Fall through to the local ruleset executor.
    }
  }

  return {
    ok: true,
    analyses: intake.records.map((record) => localAnalyze(record, intake.notes, versions)),
    engine: status.label,
    usedMock: true,
    droppedFields: intake.dropped,
    filename: intake.filename,
  };
}
