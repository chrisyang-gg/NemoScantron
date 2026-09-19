"use client";

import { useCallback, useState } from "react";
import type { ConsoleState, PipelineRun } from "@/lib/pipeline/types";

export type BenchState = ConsoleState;

export function useBench(initial: BenchState) {
  const [state, setState] = useState<BenchState>(initial);
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(
    initial.runs.find((run) => run.input.source === "website") ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load site state.");
    const payload = (await response.json()) as BenchState;
    setState(payload);
    return payload;
  }, []);

  async function scan(payload: {
    prompt: string;
    rawText: string;
    filename?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        error?: string;
        run?: PipelineRun;
      };
      if (!response.ok) throw new Error(body.error || "Scan failed.");
      await refresh();
      if (body.run) setActiveRun(body.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  return { state, activeRun, setActiveRun, busy, error, scan };
}
