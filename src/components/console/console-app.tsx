"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineMap } from "@/components/console/pipeline-map";
import { ScanPanel } from "@/components/console/scan-panel";
import { RedTeamPanel, type RedTeamCard } from "@/components/console/red-team-panel";
import { RulesPanel } from "@/components/console/rules-panel";
import { FeedbackPanel } from "@/components/console/feedback-panel";
import { RunTrace } from "@/components/console/run-trace";
import { TeamBoard } from "@/components/console/team-board";
import type { ConsoleState, PipelineRun } from "@/lib/pipeline/types";
import { RotateCcw } from "lucide-react";

export type StatePayload = ConsoleState & { redTeam: RedTeamCard[] };

export function ConsoleApp({ initial }: { initial: StatePayload }) {
  const [state, setState] = useState<StatePayload>(initial);
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(
    initial.runs[0] ?? null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("scan");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load bench state.");
    const payload = (await response.json()) as StatePayload;
    setState(payload);
    return payload;
  }, []);

  async function scan(payload: {
    prompt: string;
    rawText: string;
    filename?: string;
  }) {
    await mutate("/api/scan", payload, "scan");
  }

  async function inject(eventId: string) {
    await mutate("/api/red-team", { eventId }, "red-team");
  }

  async function decide(id: string, status: "accepted" | "rejected") {
    await mutate("/api/feedback", { id, status });
  }

  async function resetBench() {
    setBusy(true);
    setActionError(null);
    try {
      const response = await fetch("/api/rules?reset=1", { method: "POST" });
      if (!response.ok) throw new Error("Reset failed.");
      const payload = await refresh();
      setActiveRun(payload.runs[0] ?? null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(url: string, body: unknown, nextTab?: string) {
    setBusy(true);
    setActionError(null);
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
      if (nextTab) setTab(nextTab);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            NemoScantron
          </p>
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
            Fraud scan bench
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Sanitize what the website sends, score it against the policy pack, let
            Nemotron reason, then have Nemo dispatch. Red team events train the
            ruleset when the bench is wrong.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Metric label="Scanned" value={state.stats.scanned} />
          <Metric label="Fraud" value={state.stats.fraud} tone="fraud" />
          <Metric
            label="Suspicious"
            value={state.stats.suspicious}
            tone="suspicious"
          />
          <Metric label="Clear" value={state.stats.clear} tone="clear" />
          <Metric label="Feedback" value={state.stats.pendingFeedback} />
          <Button variant="ghost" size="sm" onClick={resetBench} disabled={busy}>
            <RotateCcw />
            Reset bench
          </Button>
        </div>
      </header>

      <PipelineMap run={activeRun} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (typeof value === "string") setTab(value);
          }}
          className="min-w-0"
        >
          <TabsList variant="line" className="w-full max-w-full flex-wrap justify-start">
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="red-team">Red team</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="scan" className="pt-4">
            <ScanPanel busy={busy} error={actionError} onScan={scan} />
          </TabsContent>
          <TabsContent value="red-team" className="pt-4">
            <RedTeamPanel
              events={state.redTeam}
              busy={busy}
              error={actionError}
              onInject={inject}
            />
          </TabsContent>
          <TabsContent value="rules" className="pt-4">
            <RulesPanel rules={state.rules} />
          </TabsContent>
          <TabsContent value="feedback" className="pt-4">
            <FeedbackPanel
              proposals={state.proposals}
              busy={busy}
              onDecide={decide}
            />
          </TabsContent>
          <TabsContent value="team" className="pt-4">
            <TeamBoard />
            <figure className="mt-6 overflow-hidden rounded-xl border bg-card p-3">
              <Image
                src="/workflow.png"
                alt="NemoScantron workflow: website and red team feed a shared ruleset, Nemotron reasons, Nemo executes, feedback trains the rules."
                width={1119}
                height={544}
                className="mx-auto h-auto w-full bg-white"
              />
              <figcaption className="mt-2 text-xs text-muted-foreground">
                Source sketch for the pipeline. Boxes map 1:1 onto the files in
                TEAM.md.
              </figcaption>
            </figure>
          </TabsContent>
        </Tabs>

        <aside className="rounded-2xl border border-emerald-500/25 bg-card p-4 lg:sticky lg:top-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Last dispatch · website output
          </p>
          <div className="mt-3">
            <RunTrace run={activeRun} />
          </div>
          {state.runs.length > 1 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Earlier runs
              </p>
              <ul className="space-y-1">
                {state.runs.slice(0, 6).map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => setActiveRun(run)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      <span className="truncate">
                        {run.input.filename ?? run.id}
                      </span>
                      <Badge variant="outline">{run.reasoning.verdict}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "fraud" | "suspicious" | "clear";
}) {
  return (
    <div className="rounded-lg border px-2.5 py-1.5">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          tone === "fraud"
            ? "font-mono text-red-300"
            : tone === "suspicious"
              ? "font-mono text-amber-200"
              : tone === "clear"
                ? "font-mono text-emerald-300"
                : "font-mono"
        }
      >
        {value}
      </p>
    </div>
  );
}
