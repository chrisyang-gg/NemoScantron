"use client";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/pipeline/types";

export function Speedometer({
  score,
  verdict,
}: {
  score: number;
  verdict: Verdict | null;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const cx = 120;
  const cy = 128;
  const r = 88;
  const needle = 72;
  const angleDeg = 180 - 180 * (clamped / 100);
  const angleRad = (angleDeg * Math.PI) / 180;
  const nx = cx + needle * Math.cos(angleRad);
  const ny = cy - needle * Math.sin(angleRad);
  const color =
    verdict === "fraud"
      ? "#f87171"
      : verdict === "suspicious"
        ? "#fbbf24"
        : verdict === "clear"
          ? "#34d399"
          : "#a1a1aa";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 240 160"
        className="w-full max-w-[280px]"
        role="img"
        aria-label={`Risk score ${clamped} of 100`}
      >
        <path
          d={arc(cx, cy, r, 180, 108)}
          fill="none"
          stroke="#34d399"
          strokeWidth="14"
          strokeLinecap="butt"
        />
        <path
          d={arc(cx, cy, r, 108, 45)}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="14"
        />
        <path
          d={arc(cx, cy, r, 45, 0)}
          fill="none"
          stroke="#f87171"
          strokeWidth="14"
        />
        <path
          d={arc(cx, cy, r - 18, 180, 0)}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="2"
        />
        {ticks(cx, cy, r)}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          className="origin-center"
        />
        <circle cx={cx} cy={cy} r="7" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="currentColor" className="text-background" />
        <text
          x="28"
          y="148"
          className="fill-muted-foreground"
          fontSize="11"
        >
          0
        </text>
        <text
          x="108"
          y="28"
          className="fill-muted-foreground"
          fontSize="11"
        >
          50
        </text>
        <text
          x="200"
          y="148"
          className="fill-muted-foreground"
          fontSize="11"
        >
          100
        </text>
      </svg>
      <p className="font-heading text-5xl leading-none tracking-tight">{clamped}</p>
      <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
        {verdict ? label(verdict) : "Awaiting history"}
      </p>
    </div>
  );
}

function label(verdict: Verdict): string {
  if (verdict === "fraud") return "Fraud";
  if (verdict === "suspicious") return "Suspicious";
  return "Clear";
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const start = polar(cx, cy, r, fromDeg);
  const end = polar(cx, cy, r, toDeg);
  const large = fromDeg - toDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function ticks(cx: number, cy: number, r: number) {
  const marks = [0, 25, 50, 75, 100];
  return marks.map((score) => {
    const deg = 180 - 180 * (score / 100);
    const a = polar(cx, cy, r - 8, deg);
    const b = polar(cx, cy, r + 8, deg);
    return (
      <line
        key={score}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
    );
  });
}

export function gaugeTone(verdict: Verdict | null) {
  return cn(
    "rounded-2xl border bg-card px-4 py-6",
    verdict === "fraud" && "border-red-500/40",
    verdict === "suspicious" && "border-amber-400/40",
    verdict === "clear" && "border-emerald-400/40",
  );
}
