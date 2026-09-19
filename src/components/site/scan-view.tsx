"use client";

import { ScanPanel } from "@/components/console/scan-panel";
import { RiskReport } from "@/components/site/risk-report";
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
          Upload a file or describe the payments in text. You get a risk score
          and a plain-language account of how that score was drawn.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <ScanPanel busy={bench.busy} error={bench.error} onScan={bench.scan} />
        </div>
        <div className="rounded-2xl border bg-card p-4 md:p-6 lg:sticky lg:top-20">
          {run ? (
            <RiskReport run={run} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No score yet. Upload a file or describe the history, then get a
              risk score.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
