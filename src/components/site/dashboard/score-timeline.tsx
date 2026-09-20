"use client";

import { useState } from "react";

export function ScoreTimeline({
  series,
}: {
  series: { timestamp: string; score: number }[];
}) {
  const [hover, setHover] = useState<{ timestamp: string; score: number } | null>(null);
  if (!series.length) {
    return <p className="px-2 py-8 text-center text-sm text-violet-300/55">No timestamps yet.</p>;
  }

  const width = 640;
  const height = 220;
  const pad = { l: 36, r: 16, t: 16, b: 36 };
  const max = Math.max(1, ...series.map((item) => item.score));
  const xs = series.map((_, i) => pad.l + (i / Math.max(1, series.length - 1)) * (width - pad.l - pad.r));
  const ys = series.map((item) => pad.t + (1 - item.score / max) * (height - pad.t - pad.b));
  const line = series.map((item, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`).join(" ");
  const area = `${line} L ${xs[xs.length - 1]} ${height - pad.b} L ${xs[0]} ${height - pad.b} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Risk over time">
        <defs>
          <linearGradient id="score-under" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#score-under)" />
        <path d={line} fill="none" stroke="#ddd6fe" strokeWidth="2" />
        {series.map((item, i) => (
          <circle
            key={`${item.timestamp}-${i}`}
            cx={xs[i]}
            cy={ys[i]}
            r={hover?.timestamp === item.timestamp ? 5 : 3}
            fill="#ede9fe"
            onMouseEnter={() => setHover(item)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <text x={pad.l} y={height - 10} className="fill-violet-300/45" fontSize="10">
          {shortTime(series[0].timestamp)}
        </text>
        <text x={width - pad.r} y={height - 10} textAnchor="end" className="fill-violet-300/45" fontSize="10">
          {shortTime(series[series.length - 1].timestamp)}
        </text>
      </svg>
      {hover ? (
        <p className="px-2 text-xs text-violet-200/80">
          {hover.timestamp} · summed risk {hover.score.toFixed(3)}
        </p>
      ) : null}
    </div>
  );
}

function shortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
