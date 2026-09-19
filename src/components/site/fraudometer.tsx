"use client";

import { useEffect, useRef, useState } from "react";
import {
  GAUGE_BANDS,
  GAUGE_COLORS,
  clampScore,
  colorFor,
  labelFor,
  scoreToAngle,
} from "@/lib/gauge";

export function Fraudometer({
  score,
  ignition,
}: {
  score: number;
  ignition: number;
}) {
  const target = clampScore(score);
  const [shown, setShown] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      frame.current = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(frame.current);
    }

    const start = performance.now();
    const keyframes: { t: number; v: number }[] = [
      { t: 0, v: 0 },
      { t: 380, v: 100 },
      { t: 760, v: 8 },
      { t: 1080, v: 92 },
      { t: 1320, v: 14 },
      { t: 1900, v: target },
    ];

    const tick = (now: number) => {
      const elapsed = now - start;
      const value = sample(keyframes, elapsed);
      setShown(value);
      if (elapsed < keyframes[keyframes.length - 1].t) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setShown(target);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [ignition, target]);

  const cx = 160;
  const cy = 168;
  const r = 118;
  const needle = 96;
  const angle = (scoreToAngle(shown) * Math.PI) / 180;
  const nx = cx + needle * Math.cos(angle);
  const ny = cy - needle * Math.sin(angle);
  const accent = colorFor(shown);
  const safeEnd = 180 - 180 * (GAUGE_BANDS.safeMax / 100);
  const maybeEnd = 180 - 180 * (GAUGE_BANDS.maybeMax / 100);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 320 210"
        className="w-full max-w-[420px] drop-shadow-[0_0_28px_rgba(167,139,250,0.18)]"
        role="img"
        aria-label={`Fraud risk ${shown} percent, ${labelFor(shown)}`}
      >
        <path
          d={arc(cx, cy, r, 180, 0)}
          fill="none"
          stroke={GAUGE_COLORS.track}
          strokeWidth="7"
        />
        <path
          d={arc(cx, cy, r, 180, safeEnd)}
          fill="none"
          stroke={GAUGE_COLORS.safe}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={arc(cx, cy, r, safeEnd, maybeEnd)}
          fill="none"
          stroke={GAUGE_COLORS.maybe}
          strokeWidth="7"
        />
        <path
          d={arc(cx, cy, r, maybeEnd, 0)}
          fill="none"
          stroke={GAUGE_COLORS.unsafe}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={accent} />
        <circle cx={cx} cy={cy} r="2" fill="#0b0618" />
        <text
          x={cx}
          y={118}
          textAnchor="middle"
          className="fill-violet-50"
          fontSize="44"
          fontWeight="600"
          fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui"
        >
          {shown}
        </text>
        <text
          x={cx}
          y={140}
          textAnchor="middle"
          className="fill-violet-200/70"
          fontSize="11"
          letterSpacing="3"
          fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui"
        >
          {labelFor(shown).toUpperCase()}
        </text>
        <text x="28" y="188" className="fill-violet-300/50" fontSize="11">
          0
        </text>
        <text x="278" y="188" className="fill-violet-300/50" fontSize="11">
          100
        </text>
      </svg>
    </div>
  );
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

function sample(frames: { t: number; v: number }[], elapsed: number) {
  if (elapsed <= frames[0].t) return frames[0].v;
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1];
    const next = frames[i];
    if (elapsed <= next.t) {
      const p = (elapsed - prev.t) / (next.t - prev.t);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * p);
      return Math.round(prev.v + (next.v - prev.v) * eased);
    }
  }
  return frames[frames.length - 1].v;
}
