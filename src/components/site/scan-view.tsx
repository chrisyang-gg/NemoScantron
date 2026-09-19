"use client";

import { ScanPanel } from "@/components/console/scan-panel";
import { FraudExplanation } from "@/components/site/fraud-explanation";
import { Speedometer, gaugeTone } from "@/components/site/speedometer";
import { useBench, type BenchState } from "@/hooks/use-bench";

export function ScanView({ initial }: { initial: BenchState }) {
  const bench = useBench(initial);
  const websiteRuns = bench.state.runs.filter(
    (run) => run.input.source === "website",
  );
  const run =
    bench.activeRun?.input.source === "website"
      ? bench.activeRun
      : (websiteRuns[0] ?? null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          Score a transaction history
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Upload a file or describe the payments in text. The gauge in the middle
          is the risk score. Under it is the written case for why that score
          looks like fraud — or why it does not.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <ScanPanel busy={bench.busy} error={bench.error} onScan={bench.scan} />
        </div>

        <div className={gaugeTone(run?.reasoning.verdict ?? null)}>
          <Speedometer
            score={run?.metrics.riskScore ?? 0}
            verdict={run?.reasoning.verdict ?? null}
          />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {run?.input.filename ?? "No history scored yet"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 md:p-6">
          {run ? (
            <div className="space-y-3">
              <h2 className="font-heading text-lg">
                {run.reasoning.explanation?.headline ?? run.reasoning.summary}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {run.reasoning.summary}
              </p>
              <p className="text-xs text-muted-foreground">
                Confidence {Math.round(run.reasoning.confidence * 100)}% ·{" "}
                {run.metrics.ruleHits} policy hit
                {run.metrics.ruleHits === 1 ? "" : "s"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The needle sits at zero until a history is scored. Load a sample
              to see a fraud reading and the write-up below.
            </p>
          )}
        </div>
      </div>

      {run?.reasoning.explanation ? (
        <div className="mt-6">
          <FraudExplanation run={run} />
        </div>
      ) : null}
    </div>
  );
}
