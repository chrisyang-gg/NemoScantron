"use client";

import { useState } from "react";
import { GAUGE_COLORS, type GaugeBand } from "@/lib/gauge";

const LABELS: Record<GaugeBand, string> = {
  safe: "Low risk",
  maybe: "Medium risk",
  unsafe: "High risk",
};

export function RiskDonut({
  bands,
  total,
}: {
  bands: Record<GaugeBand, number>;
  total: number;
}) {
  const slices: { key: GaugeBand; value: number; color: string }[] = [
    { key: "unsafe", value: bands.unsafe, color: GAUGE_COLORS.unsafe },
    { key: "maybe", value: bands.maybe, color: GAUGE_COLORS.maybe },
    { key: "safe", value: bands.safe, color: GAUGE_COLORS.safe },
  ];
  const [hover, setHover] = useState<GaugeBand | null>(null);
  const radius = 68;
  const stroke = 22;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-full w-full" role="img" aria-label="Risk mix">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth={stroke} />
        {slices.map((slice) => {
          const portion = total ? slice.value / total : 0;
          const dash = portion * circ;
          const gap = circ - dash;
          const current = offset;
          offset += dash;
          return (
            <circle
              key={slice.key}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={hover === slice.key ? stroke + 3 : stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-current}
              strokeLinecap="butt"
              transform="rotate(-90 90 90)"
              className="cursor-pointer"
              onMouseEnter={() => setHover(slice.key)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-semibold text-violet-50">{total}</p>
        <p className="text-[10px] tracking-[0.18em] text-violet-300/60 uppercase">Detections</p>
      </div>
      {hover ? (
        <p className="absolute -bottom-1 w-full text-center text-xs text-violet-100">
          {LABELS[hover]} · {total ? Math.round((bands[hover] / total) * 100) : 0}%
        </p>
      ) : null}
    </div>
  );
}
