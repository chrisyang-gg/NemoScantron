import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { cn } from "@/lib/utils";

export function AnalysisCard({
  analysis,
  engine,
  extra,
}: {
  analysis: NemotronAnalysis;
  engine: string;
  extra?: string | null;
}) {
  return (
    <section className="w-full max-w-[640px] rounded-2xl border border-violet-500/25 bg-[#140c22]/90 px-4 py-4 text-sm text-violet-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.28em] text-violet-300/70 uppercase">
          Nemotron decision
        </p>
        <span className="rounded-full border border-violet-400/20 px-2.5 py-0.5 text-[11px] text-violet-200/80">
          {analysis.decision.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-3 leading-relaxed text-violet-100/90">{analysis.reasoning}</p>
      <p className="mt-3 text-violet-200/80">
        <span className="text-violet-300/70">Action: </span>
        {analysis.recommended_action}
      </p>
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
    </section>
  );
}

function severityColor(severity: string): string {
  if (severity === "critical" || severity === "high") return "text-[#f0b4b0]";
  if (severity === "medium") return "text-[#e6d39a]";
  return "text-violet-300/70";
}
