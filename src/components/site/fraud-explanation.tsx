"use client";

import { Badge } from "@/components/ui/badge";
import type { PipelineRun } from "@/lib/pipeline/types";

export function FraudExplanation({ run }: { run: PipelineRun }) {
  const explanation = run.reasoning.explanation;
  if (!explanation) return null;
  const { verdict } = run.reasoning;
  const title =
    verdict === "clear"
      ? "Why this is not treated as fraud"
      : "Why this is suspected as fraud";

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="font-heading text-xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed md:text-base">{explanation.body}</p>

      {explanation.findings.length ? (
        <ol className="mt-6 space-y-4">
          {explanation.findings.map((finding, index) => (
            <li
              key={`${finding.title}-${index}`}
              className="rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-medium">{finding.title}</h3>
                <Badge variant="outline">{finding.severity}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{finding.why}</p>
              <p className="mt-2 text-xs text-muted-foreground">{finding.policy}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                In the history: {finding.evidence.map((item) => `“${item}”`).join(" · ")}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No named policy fired. The gauge is sitting on residual risk only.
        </p>
      )}
    </section>
  );
}
