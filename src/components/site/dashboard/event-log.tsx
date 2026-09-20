import { decisionPastTense } from "@/lib/history/labels";
import type { HistoryEvent } from "@/lib/history/store";

const COLUMNS = [
  "timestamp",
  "risk score",
  "decision",
  "transaction_id",
  "merchant risk score",
  "rules triggered",
  "amount",
] as const;

export function EventLog({ events }: { events: HistoryEvent[] }) {
  const rows = events.slice(-10).reverse();

  return (
    <div className="violet-scroll overflow-x-auto rounded-xl border border-violet-500/15">
      <table className="min-w-[880px] w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-[#1a1228] text-[11px] tracking-[0.14em] text-violet-300/70 uppercase">
            {COLUMNS.map((column) => (
              <th key={column} className="px-3 py-2 font-medium whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((event, index) => (
              <tr
                key={`${event.transaction_id}-${event.recordedAt}-${index}`}
                className={index % 2 === 0 ? "bg-[#20162f]" : "bg-[#161022]"}
              >
                <td className="px-3 py-2 whitespace-nowrap text-violet-100/90">{event.timestamp}</td>
                <td className="px-3 py-2 whitespace-nowrap">{event.risk_score.toFixed(3)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{decisionPastTense(event.decision)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{event.transaction_id}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {event.merchant_risk_score == null ? "—" : event.merchant_risk_score.toFixed(3)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {event.rules_triggered.length ? event.rules_triggered.join(", ") : "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {event.amount == null ? "—" : event.amount.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="bg-[#161022]">
              <td className="px-3 py-6 text-violet-300/50" colSpan={COLUMNS.length}>
                No scored events yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
