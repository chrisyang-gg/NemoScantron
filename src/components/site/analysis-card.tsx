import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { cn } from "@/lib/utils";

export function AnalysisCard({
  analysis,
  engine,
  extra,
  onClear,
}: {
  analysis: NemotronAnalysis | null;
  engine: string;
  extra?: string | null;
  onClear?: () => void;
}) {
  return (
    <section className="flex h-full min-h-[320px] w-full flex-col rounded-2xl border border-violet-500/25 bg-[#140c22]/90 px-4 py-4 text-sm text-violet-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.28em] text-violet-300/70 uppercase">
          Nemotron decision
        </p>
        {analysis ? (
          <span className="rounded-full border border-violet-400/20 px-2.5 py-0.5 text-[11px] text-violet-200/80">
            {analysis.decision.replaceAll("_", " ")}
          </span>
        ) : null}
      </div>

      {analysis ? (
        <>
          <p className="mt-3 leading-relaxed text-violet-100/90">{analysis.reasoning}</p>
          {analysis.rules_triggered.length ? (
            <p className="mt-3 text-xs text-violet-300/70">
              Rules: {analysis.rules_triggered.join(", ")}
            </p>
          ) : null}
          {analysis.patterns_matched.length ? (
            <p className="mt-1 text-xs text-violet-300/70">
              Patterns: {analysis.patterns_matched.join(", ")}
            </p>
          ) : null}
          {analysis.fraud_indicators.length ? (
            <ul className="mt-3 space-y-1.5 text-xs text-violet-200/75">
              {analysis.fraud_indicators.slice(0, 4).map((item) => (
                <li key={`${item.indicator}-${item.detail}`}>
                  <span className={cn("uppercase", severityColor(item.severity))}>
                    {item.severity}
                  </span>
                  {" — "}
                  {item.detail}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-[11px] text-violet-300/45">
            Confidence {analysis.confidence.toFixed(3)}
            {analysis.escalate_to_analyst ? " · escalate to analyst" : ""}
            {" · "}
            {engine}
          </p>
          {extra ? <p className="mt-2 text-xs text-violet-300/55">{extra}</p> : null}
        </>
      ) : (
        <p className="mt-6 flex-1 text-sm leading-relaxed text-violet-300/55">
          Score a JSON file to fill this card. The fraudometer sits to the left once a
          decision lands.
        </p>
      )}

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-auto h-11 w-full rounded-xl bg-[#6e4a4a] text-sm font-medium text-[#f0d6d4] transition hover:bg-[#7d5555]"
        >
          Clear
        </button>
      ) : null}
    </section>
  );
}

function severityColor(severity: string): string {
  if (severity === "critical" || severity === "high") return "text-[#f0b4b0]";
  if (severity === "medium") return "text-[#e6d39a]";
  return "text-violet-300/70";
}
