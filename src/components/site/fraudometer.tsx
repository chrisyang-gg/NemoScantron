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
  const [needleScore, setNeedleScore] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      frame.current = requestAnimationFrame(() => setNeedleScore(target));
      return () => cancelAnimationFrame(frame.current);
    }

    const start = performance.now();
    const keyframes: { t: number; v: number }[] = [
      { t: 0, v: 0 },
      { t: 750, v: 100 },
      { t: 1500, v: 0 },
      { t: 2100, v: target },
    ];

    const tick = (now: number) => {
      const elapsed = now - start;
      setNeedleScore(sample(keyframes, elapsed));
      if (elapsed < keyframes[keyframes.length - 1].t) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setNeedleScore(target);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [ignition, target]);

  const cx = 160;
  const cy = 178;
  const r = 118;
  const needle = 92;
  const angle = (scoreToAngle(needleScore) * Math.PI) / 180;
  const nx = cx + needle * Math.cos(angle);
  const ny = cy - needle * Math.sin(angle);
  const needleColor = colorFor(needleScore);
  const safeEnd = scoreToAngle(GAUGE_BANDS.safeMax);
  const maybeEnd = scoreToAngle(GAUGE_BANDS.maybeMax);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 320 220"
        className="w-full max-w-[420px]"
        role="img"
        aria-label={`Fraud risk ${target} percent, ${labelFor(target)}`}
      >
        <path
          d={uprightArc(cx, cy, r, 180, safeEnd)}
          fill="none"
          stroke={GAUGE_COLORS.safe}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={uprightArc(cx, cy, r, safeEnd, maybeEnd)}
          fill="none"
          stroke={GAUGE_COLORS.maybe}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={uprightArc(cx, cy, r, maybeEnd, 0)}
          fill="none"
          stroke={GAUGE_COLORS.unsafe}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={needleColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={needleColor} />
        <circle cx={cx} cy={cy} r="2" fill="#0b0618" />
        <text
          x={cx}
          y={128}
          textAnchor="middle"
          className="fill-violet-50"
          fontSize="44"
          fontWeight="600"
          fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui"
        >
          {target}
        </text>
        <text
          x={cx}
          y={150}
          textAnchor="middle"
          className="fill-violet-200/70"
          fontSize="11"
          letterSpacing="3"
          fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui"
        >
          {labelFor(target).toUpperCase()}
        </text>
        <text x="28" y="198" className="fill-violet-300/50" fontSize="11">
          0
        </text>
        <text x="278" y="198" className="fill-violet-300/50" fontSize="11">
          100
        </text>
      </svg>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: roundSvgCoordinate(cx + r * Math.cos(rad)),
    y: roundSvgCoordinate(cy - r * Math.sin(rad)),
  };
}

function roundSvgCoordinate(value: number) {
  return Number(value.toFixed(6));
}

/** Trace left→right through the top (rainbow). Avoids SVG sweep flipping the arch. */
function uprightArc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const steps = 24;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const deg = fromDeg + ((toDeg - fromDeg) * i) / steps;
    const point = polar(cx, cy, r, deg);
    parts.push(`${i === 0 ? "M" : "L"} ${point.x} ${point.y}`);
  }
  return parts.join(" ");
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
