import { Badge } from "@/components/ui/badge";
import { RunTrace } from "@/components/console/run-trace";
import type { PipelineRun } from "@/lib/pipeline/types";

export function ResultRail({
  run,
  runs,
  onSelect,
  emptyHint,
}: {
  run: PipelineRun | null;
  runs: PipelineRun[];
  onSelect: (run: PipelineRun) => void;
  emptyHint: string;
}) {
  return (
    <aside className="rounded-2xl border border-emerald-500/25 bg-card p-4 lg:sticky lg:top-20">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Site output
      </p>
      <div className="mt-3">
        {run ? (
          <RunTrace run={run} />
        ) : (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        )}
      </div>
      {runs.length > 1 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Earlier on this site
          </p>
          <ul className="space-y-1">
            {runs.slice(0, 6).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  <span className="truncate">{item.input.filename ?? item.id}</span>
                  <Badge variant="outline">{item.reasoning.verdict}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
