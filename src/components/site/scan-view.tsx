"use client";

import { ScanPanel } from "@/components/console/scan-panel";
import { ResultRail } from "@/components/site/result-rail";
import { useBench, type BenchState } from "@/hooks/use-bench";

export function ScanView({ initial }: { initial: BenchState }) {
  const bench = useBench(initial);
  const websiteRuns = bench.state.runs.filter((run) => run.input.source === "website");
  const run =
    bench.activeRun?.input.source === "website"
      ? bench.activeRun
      : (websiteRuns[0] ?? null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="max-w-2xl">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Website intake
        </p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight md:text-4xl">
          Submit a file
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Paste or drop the email, invoice, or payroll dump and ask the question
          you want answered. Output comes back on the right as a risk score, a
          description, and the Nemo action.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <ScanPanel busy={bench.busy} error={bench.error} onScan={bench.scan} />
        </div>
        <ResultRail
          run={run}
          runs={websiteRuns}
          onSelect={bench.setActiveRun}
          emptyHint="Nothing on the site yet. Submit a file or load the sample claim."
        />
      </div>
    </div>
  );
}
