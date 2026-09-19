import { assemblePrompt } from "@/lib/ruleset/assemble";
import { callNemotron, nemotronStatus } from "@/lib/nemotron/call";
import { parseNemotronOutput } from "@/lib/nemotron/parse";
import { prepareRecords, type AnalyzeInput } from "@/lib/nemotron/intake";
import type { AnalyzeResponse } from "@/lib/nemotron/types";

export type { AnalyzeInput };

export async function runAnalyze(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const intake = prepareRecords(input);
  if (!intake.ok) return intake;

  const status = nemotronStatus();
  if (!status.live) {
    return {
      ok: false,
      error: "NVIDIA_API_KEY is missing. Add it to .env and restart the dev server.",
    };
  }

  try {
    const prompt = assemblePrompt(intake.records, intake.notes);
    const raw = await callNemotron(prompt);
    if (!raw.ok) return raw;
    return {
      ok: true,
      analyses: parseNemotronOutput(raw.text),
      engine: status.label,
      droppedFields: intake.dropped,
      filename: intake.filename,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nemotron request failed.",
    };
  }
}
