"use client";

import { Badge } from "@/components/ui/badge";
import type { PipelineRun, Verdict } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export function RiskReport({ run }: { run: PipelineRun }) {
  const { reasoning, metrics } = run;

  return (
    <article className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border px-5 py-6 text-center",
          reasoning.verdict === "fraud" && "border-red-500/40 bg-red-500/10",
          reasoning.verdict === "suspicious" && "border-amber-400/40 bg-amber-400/10",
          reasoning.verdict === "clear" && "border-emerald-400/40 bg-emerald-500/10",
        )}
      >
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Risk score
        </p>
        <p className="font-heading text-6xl tracking-tight md:text-7xl">
          {metrics.riskScore}
        </p>
        <VerdictLabel verdict={reasoning.verdict} />
        <p className="mt-2 text-sm text-muted-foreground">
          {run.input.filename ?? "typed history"}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-heading text-lg">How we reached this</h2>
        <p className="text-sm leading-relaxed md:text-base">{reasoning.summary}</p>
        <ol className="mt-3 space-y-3">
          {reasoning.steps.map((step, index) => (
            <li key={step.title} className="text-sm leading-relaxed">
              <span className="font-mono text-muted-foreground">
                {index + 1}.
              </span>{" "}
              <span className="font-medium">{step.title}.</span> {step.detail}
            </li>
          ))}
        </ol>
      </section>

      {reasoning.matchedRules.length ? (
        <section className="space-y-2">
          <h3 className="text-xs tracking-wide text-muted-foreground uppercase">
            Evidence
          </h3>
          <ul className="space-y-2">
            {reasoning.matchedRules.map((hit) => (
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
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No policy signals fired. The score is residual risk from size and
          wording, not a named pattern.
        </p>
      )}
    </article>
  );
}

function VerdictLabel({ verdict }: { verdict: Verdict }) {
  const label =
    verdict === "fraud"
      ? "Fraud"
      : verdict === "suspicious"
        ? "Suspicious"
        : "Clear";
  return (
    <p className="mt-1 text-sm font-medium tracking-wide uppercase">{label}</p>
  );
}
