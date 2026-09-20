import type { ReactNode } from "react";
import type { HistoryEvent } from "@/lib/history/store";
import { riskBands, ruleCounts, scoresByTimestamp } from "@/lib/history/store";
import { EventLog } from "@/components/site/dashboard/event-log";
import { RiskDonut } from "@/components/site/dashboard/risk-donut";
import { RuleBarGrid } from "@/components/site/dashboard/rule-bar-grid";
import { ScoreTimeline } from "@/components/site/dashboard/score-timeline";

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-4 ${className}`}
    >
      <h3 className="mb-3 text-[11px] tracking-[0.22em] text-violet-300/65 uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function EnterpriseDashboard({ events }: { events: HistoryEvent[] }) {
  const bands = riskBands(events);
  const series = scoresByTimestamp(events);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Rule detections" className="md:col-span-2">
        <RuleBarGrid counts={ruleCounts(events)} />
      </Panel>
      <Panel title="Risk mix">
        <RiskDonut bands={bands} total={events.length} />
      </Panel>
      <Panel title="Risk by timestamp" className="md:col-span-1">
        <ScoreTimeline series={series} />
      </Panel>
      <Panel title="Recent events" className="md:col-span-2">
        <EventLog events={events} />
      </Panel>
    </div>
  );
}
