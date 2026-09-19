"use client";

import { cn } from "@/lib/utils";
import type { PipelineRun } from "@/lib/pipeline/types";

const STAGES = [
  {
    id: "input",
    title: "Website / User input",
    detail: "File or text history",
    lane: "A · Intake",
    className: "border-zinc-400/70 bg-zinc-500/10",
  },
  {
    id: "sanitize",
    title: "Input sanitizing",
    detail: "Strip, mask, warn",
    lane: "A · Intake",
    className: "border-amber-400/80 bg-amber-400/10",
  },
  {
    id: "red-team",
    title: "AI red team",
    detail: "Developer trend training",
    lane: "C · Execution",
    className: "border-red-500/80 bg-red-500/10",
  },
  {
    id: "rules",
    title: "Ruleset, policies, workflow",
    detail: "What the bench believes",
    lane: "B · Policy",
    className: "border-orange-400/80 bg-orange-500/10",
  },
  {
    id: "reason",
    title: "Nemotron reasoning",
    detail: "Verdict + trace",
    lane: "B · Policy",
    className: "border-sky-400/80 bg-sky-500/10",
  },
  {
    id: "execute",
    title: "Execution workflow",
    detail: "Dispatched by Nemo",
    lane: "C · Execution",
    className: "border-emerald-400/80 bg-emerald-500/10",
  },
  {
    id: "feedback",
    title: "AI feedback loop",
    detail: "Reasons over misses",
    lane: "B · Policy",
    className: "border-violet-400/80 bg-violet-500/10",
  },
] as const;

type StageId = (typeof STAGES)[number]["id"];

export function PipelineMap({ run }: { run: PipelineRun | null }) {
  const active = new Set<StageId>();
  if (run) {
    if (run.input.source === "website") active.add("input");
    if (run.input.source === "red-team") active.add("red-team");
    active.add("sanitize");
    active.add("rules");
    active.add("reason");
    active.add("execute");
    if (run.feedback.length) active.add("feedback");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Live workflow
          </p>
          <h2 className="font-heading text-lg">How a case moves through NemoScantron</h2>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          The website scores a transaction history. Developers train new
          suspicious trends with an AI red team off this site. Nemotron explains
          the score on the scan page.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-6">
        <Node stage={STAGES[0]} active={active.has("input")} className="md:col-span-2" />
        <Arrow className="hidden md:flex" />
        <Node stage={STAGES[1]} active={active.has("sanitize")} className="md:col-span-2" />
        <div className="hidden md:block" />

        <Node stage={STAGES[2]} active={active.has("red-team")} className="md:col-span-2" />
        <Arrow className="hidden md:flex" label="merge" />
        <Node stage={STAGES[3]} active={active.has("rules")} className="md:col-span-3" />

        <div className="hidden md:block md:col-span-2" />
        <Arrow className="hidden md:flex md:col-span-1" />
        <Node stage={STAGES[4]} active={active.has("reason")} className="md:col-span-3" />

        <div className="hidden md:block md:col-span-2" />
        <Arrow className="hidden md:flex" />
        <Node stage={STAGES[5]} active={active.has("execute")} className="md:col-span-3" />

        <Node
          stage={STAGES[6]}
          active={active.has("feedback")}
          className="md:col-span-2 md:col-start-1"
        />
        <p className="flex items-center text-xs text-muted-foreground md:col-span-4">
          Output on the website is a risk score and the reasoning behind it.
          Developers introduce new suspicious trends with{" "}
          <code>npm run train-trends</code>; that training never appears as a
          public page.
        </p>
      </div>
    </div>
  );
}

function Node({
  stage,
  active,
  className,
}: {
  stage: (typeof STAGES)[number];
  active: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-all",
        stage.className,
        active && "ring-2 ring-foreground/40",
        className,
      )}
    >
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {stage.lane}
      </p>
      <p className="font-medium">{stage.title}</p>
      <p className="text-xs text-muted-foreground">{stage.detail}</p>
    </div>
  );
}

function Arrow({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "items-center justify-center text-muted-foreground",
        className,
      )}
    >
      <span className="text-lg leading-none">→</span>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
