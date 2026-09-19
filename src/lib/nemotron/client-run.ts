import { localAnalyze } from "@/lib/nemotron/local-analyze";
import { prepareRecords } from "@/lib/nemotron/intake";
import type { AnalyzeResponse } from "@/lib/nemotron/types";

export async function analyzeSubmission(input: {
  notes: string;
  file: { name: string; text: string; mime?: string } | null;
}): Promise<AnalyzeResponse> {
  const intake = prepareRecords(input);
  if (!intake.ok) return intake;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: intake.notes,
        file: input.file,
      }),
    });
    if (response.ok) {
      return (await response.json()) as AnalyzeResponse;
    }
  } catch {
    // Static hosts have no API route — run the local ruleset executor.
  }

  return {
    ok: true,
    analyses: intake.records.map((record) => localAnalyze(record, intake.notes)),
    engine: "nemoscantron-local (ruleset mock)",
    usedMock: true,
    droppedFields: intake.dropped,
    filename: intake.filename,
  };
}

export function worstAnalysis<T extends { risk_score: number }>(analyses: T[]): T {
  return analyses.reduce((worst, item) => (item.risk_score > worst.risk_score ? item : worst));
}
