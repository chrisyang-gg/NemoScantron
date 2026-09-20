import type { NemotronAnalysis } from "@/lib/nemotron/types";

export function RecommendationPanel({ analyses }: { analyses: NemotronAnalysis[] }) {
  if (!analyses.length) {
    return (
      <EmptyCopy text="Score a file to see Nemotron’s recommended action for each transaction." />
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <article
          key={analysis.transaction_id}
          className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] tracking-[0.22em] text-violet-300/60 uppercase">
              {analysis.transaction_id}
            </p>
            <span className="text-xs text-violet-200/70">
              {analysis.decision.replaceAll("_", " ")}
              {analysis.escalate_to_analyst ? " · escalate" : ""}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-violet-50">
            {analysis.recommended_action || "No recommended action returned."}
          </p>
        </article>
      ))}
    </div>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-violet-500/15 bg-violet-500/5 px-4 py-8 text-sm text-violet-300/60">
      {text}
    </p>
  );
}
