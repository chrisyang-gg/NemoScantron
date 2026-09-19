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
    const data = (await response.json()) as AnalyzeResponse | { error?: string };
    if ("ok" in data && data.ok) return data;
    const message =
      "ok" in data && !data.ok
        ? data.error
        : "error" in data && data.error
          ? data.error
          : `Nemotron request failed (${response.status}).`;
    return { ok: false, error: message };
  } catch {
    return {
      ok: false,
      error:
        "Could not reach Nemotron. Run the app with npm run dev and set NVIDIA_API_KEY in .env.",
    };
  }
}

export function worstAnalysis<T extends { risk_score: number }>(analyses: T[]): T {
  return analyses.reduce((worst, item) => (item.risk_score > worst.risk_score ? item : worst));
}
