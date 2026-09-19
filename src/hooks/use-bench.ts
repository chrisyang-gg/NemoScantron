"use client";

import { useCallback, useState } from "react";
import type { AttackFamilyCard } from "@/components/console/red-team-panel";
import type { ConsoleState, PipelineRun } from "@/lib/pipeline/types";

export type BenchState = ConsoleState & { attackFamilies: AttackFamilyCard[] };

export function useBench(initial: BenchState) {
  const [state, setState] = useState<BenchState>(initial);
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(
    initial.runs[0] ?? null,
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

  async function mutate(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        error?: string;
        run?: PipelineRun;
      };
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      const next = await refresh();
      if (payload.run) setActiveRun(payload.run);
      else setActiveRun(next.runs[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return {
    state,
    activeRun,
    setActiveRun,
    busy,
    error,
    scan: (payload: { prompt: string; rawText: string; filename?: string }) =>
      mutate("/api/scan", payload),
    generate: (payload: { family: string; brief: string }) =>
      mutate("/api/red-team", payload),
    replay: (id: string) => mutate("/api/red-team", { replayId: id }),
    decide: (id: string, status: "accepted" | "rejected") =>
      mutate("/api/feedback", { id, status }),
    async reset() {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/rules?reset=1", { method: "POST" });
        if (!response.ok) throw new Error("Reset failed.");
        const payload = await refresh();
        setActiveRun(payload.runs[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Reset failed.");
      } finally {
        setBusy(false);
      }
    },
  };
}
