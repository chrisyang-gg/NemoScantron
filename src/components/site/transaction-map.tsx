"use client";

import { useState } from "react";
import type { HistoryEvent } from "@/lib/history/store";
import { bandFor } from "@/lib/gauge";
import { GAUGE_COLORS } from "@/lib/gauge";

export function TransactionMap({ events }: { events: HistoryEvent[] }) {
  const points = events
    .map((event, index) => ({ event, ...project(event, index) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const [hover, setHover] = useState<HistoryEvent | null>(null);

  if (!points.length) {
    return (
      <p className="rounded-2xl border border-violet-500/15 bg-violet-500/5 px-4 py-8 text-sm text-violet-300/60">
        Scored transactions with a city, country, or coordinates appear on this map.
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
      <svg viewBox="0 0 640 320" className="h-auto w-full" role="img" aria-label="Transaction map">
        <rect width="640" height="320" fill="#120a1e" />
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={40 + i * 70}
            y1="20"
            x2={40 + i * 70}
            y2="300"
            stroke="rgba(167,139,250,0.08)"
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="20"
            y1={20 + i * 46}
            x2="620"
            y2={20 + i * 46}
            stroke="rgba(167,139,250,0.08)"
          />
        ))}
        <path
          d="M80 70 C140 50 210 90 260 80 C310 70 340 110 400 100 C470 88 520 130 560 120"
          fill="none"
          stroke="rgba(167,139,250,0.18)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M70 180 C150 150 220 200 300 170 C370 145 430 200 520 190"
          fill="none"
          stroke="rgba(167,139,250,0.12)"
          strokeWidth="28"
          strokeLinecap="round"
        />
        {points.map((point) => (
          <circle
            key={`${point.event.transaction_id}-${point.event.recordedAt}`}
            cx={point.x}
            cy={point.y}
            r={hover?.transaction_id === point.event.transaction_id ? 8 : 5}
            fill={GAUGE_COLORS[bandFor(point.event.risk_score * 100)]}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            onMouseEnter={() => setHover(point.event)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover ? (
        <p className="pointer-events-none absolute right-4 bottom-4 rounded-lg border border-violet-400/20 bg-[#140c22]/95 px-3 py-2 text-xs text-violet-100">
          {hover.city ?? "Unknown city"}
          {hover.country ? `, ${hover.country}` : ""}
          {" · "}
          {hover.transaction_id}
          {" · "}
          {Math.round(hover.risk_score * 100)}
        </p>
      ) : (
        <p className="px-2 pt-2 text-[11px] text-violet-300/45">
          Points use coordinates when present, otherwise city and country.
        </p>
      )}
    </div>
  );
}

function project(event: HistoryEvent, index: number): { x: number; y: number } {
  if (event.latitude != null && event.longitude != null) {
    return {
      x: 40 + ((event.longitude + 180) / 360) * 560,
      y: 28 + ((90 - event.latitude) / 180) * 264,
    };
  }
  const seed = hash(`${event.country ?? ""}:${event.city ?? ""}:${event.transaction_id}`);
  if (event.country || event.city) {
    return {
      x: 50 + (seed % 540),
      y: 36 + ((seed >> 8) % 240),
    };
  }
  return {
    x: 80 + (index % 8) * 68,
    y: 50 + Math.floor(index / 8) * 54,
  };
}

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 33 + text.charCodeAt(i)) >>> 0;
  return value;
}
