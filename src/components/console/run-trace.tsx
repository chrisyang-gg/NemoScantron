"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PipelineRun, Verdict } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export function RunTrace({ run }: { run: PipelineRun | null }) {
  if (!run) {
    return (
      <Alert>
        <AlertTitle>No run yet</AlertTitle>
        <AlertDescription>
          Scan a file from the website intake, or inject a red-team event. The trace
          lands here as the metric and description the site would show.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">{run.id}</p>
          <h3 className="font-heading text-base">
            {run.input.filename ?? "pasted intake"}
          </h3>
          <p className="text-sm text-muted-foreground">{run.metrics.description}</p>
        </div>
        <VerdictBadge verdict={run.reasoning.verdict} score={run.metrics.riskScore} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Risk" value={String(run.metrics.riskScore)} />
        <Stat label="Rule hits" value={String(run.metrics.ruleHits)} />
        <Stat label="Latency" value={`${run.metrics.latencyMs} ms`} />
      </div>

      <section className="space-y-2">
        <h4 className="text-xs tracking-wide text-muted-foreground uppercase">
          Sanitizer
        </h4>
        <p className="text-sm">
          {run.sanitized.originalChars} chars in → {run.sanitized.text.length} out.
          {run.sanitized.stripped.length
            ? ` Stripped ${run.sanitized.stripped.join(", ")}.`
            : " Nothing stripped."}
        </p>
        {run.sanitized.warnings.map((warning) => (
          <p key={warning} className="text-sm text-amber-400">
            {warning}
          </p>
        ))}
        {run.sanitized.masked.map((item) => (
          <p key={item.label} className="text-sm text-muted-foreground">
            Masked {item.count} {item.label} value{item.count === 1 ? "" : "s"}.
          </p>
        ))}
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="text-xs tracking-wide text-muted-foreground uppercase">
          Nemotron
        </h4>
        <p className="text-xs text-muted-foreground">{run.reasoning.engine}</p>
        <ol className="space-y-2">
          {run.reasoning.steps.map((step, index) => (
            <li key={step.title} className="text-sm">
              <span className="font-mono text-muted-foreground">{index + 1}.</span>{" "}
              <span className="font-medium">{step.title}.</span> {step.detail}
            </li>
          ))}
        </ol>
        {run.reasoning.matchedRules.length ? (
          <ul className="space-y-1">
            {run.reasoning.matchedRules.map((hit) => (
              <li key={hit.ruleId} className="text-sm">
                <Badge variant="outline" className="mr-2">
                  {hit.severity}
                </Badge>
                {hit.title}
                <span className="text-muted-foreground">
                  {" "}
                  — {hit.evidence.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No policy signals fired.</p>
        )}
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="text-xs tracking-wide text-muted-foreground uppercase">
          Nemo dispatch
        </h4>
        <ul className="space-y-2">
          {run.actions.map((action) => (
            <li key={action.id} className="text-sm">
              <span className="font-mono text-xs">{action.kind}</span>{" "}
              <Badge variant="secondary">{action.status}</Badge>
              <p className="text-muted-foreground">{action.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-3">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-lg">{value}</p>
    </div>
  );
}

function VerdictBadge({ verdict, score }: { verdict: Verdict; score: number }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-right",
        verdict === "fraud" && "border-red-500/50 bg-red-500/10 text-red-300",
        verdict === "suspicious" && "border-amber-400/50 bg-amber-400/10 text-amber-200",
        verdict === "clear" && "border-emerald-400/50 bg-emerald-500/10 text-emerald-300",
      )}
    >
      <p className="text-[10px] tracking-wide uppercase">Website metric</p>
      <p className="font-heading text-xl leading-none">{verdict}</p>
      <p className="font-mono text-xs opacity-80">score {score}</p>
    </div>
  );
}
