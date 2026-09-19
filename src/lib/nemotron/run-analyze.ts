import { assemblePrompt } from "@/lib/ruleset/assemble";
import { callNemotron, nemotronStatus } from "@/lib/nemotron/call";
import { isRawJsonParseError, parseNemotronOutput } from "@/lib/nemotron/parse";
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
    const first = await callNemotron(prompt);
    if (!first.ok) return first;
    const analyses = await parseOrRetry(first.text, prompt);
    return {
      ok: true,
      analyses,
      engine: status.label,
      droppedFields: intake.dropped,
      filename: intake.filename,
    };
  } catch (error) {
    return {
      ok: false,
      error: isRawJsonParseError(error)
        ? "Nemotron returned a broken JSON score. Submit again — long histories sometimes get cut off."
        : error instanceof Error
          ? error.message
          : "Nemotron request failed.",
    };
  }
}

async function parseOrRetry(text: string, prompt: string) {
  try {
    return parseNemotronOutput(text);
  } catch {
    const retry = await callNemotron(
      `${prompt}\n\nThe previous reply was not valid JSON. Return only a complete FILE 8 JSON object or array. No markdown, no trailing commas, no comments, no ellipses.`,
    );
    if (!retry.ok) throw new Error(retry.error);
    return parseNemotronOutput(retry.text);
  }
}
