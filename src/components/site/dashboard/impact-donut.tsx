"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/history/labels";
import { RULE_FAMILY_META, type RuleFamily } from "@/lib/history/rules";

const FAMILY_ORDER: RuleFamily[] = ["velocity", "geo", "merchant", "attack", "threshold", "other"];

export function ImpactDonut({
  total,
  byFamily,
}: {
  total: number;
  byFamily: Record<RuleFamily, number>;
}) {
  const slices = FAMILY_ORDER.map((key) => ({
    key,
    value: byFamily[key] ?? 0,
    color: `hsl(${RULE_FAMILY_META[key].hue} 72% 58%)`,
    label: RULE_FAMILY_META[key].label,
  })).filter((slice) => slice.value > 0);
  const legend = slices.length
    ? slices
    : FAMILY_ORDER.slice(0, 3).map((key) => ({
        key,
        color: `hsl(${RULE_FAMILY_META[key].hue} 72% 58%)`,
        label: RULE_FAMILY_META[key].label,
      }));
  const [hover, setHover] = useState<RuleFamily | null>(null);
  const radius = 68;
  const stroke = 22;
  const circ = 2 * Math.PI * radius;
  const ringTotal = slices.reduce((sum, slice) => sum + slice.value, 0);
  const drawn = slices.map((slice, index) => {
    const portion = ringTotal ? slice.value / ringTotal : 0;
    const dash = portion * circ;
    const offset = slices.slice(0, index).reduce((sum, item) => sum + (ringTotal ? (item.value / ringTotal) * circ : 0), 0);
    return { ...slice, dash, gap: circ - dash, offset };
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <svg viewBox="0 0 180 180" className="h-full w-full" role="img" aria-label="Dollars at risk by rule family">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth={stroke} />
          {drawn.map((slice) => (
            <circle
              key={slice.key}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={hover === slice.key ? stroke + 3 : stroke}
              strokeDasharray={`${slice.dash} ${slice.gap}`}
              strokeDashoffset={-slice.offset}
              strokeLinecap="butt"
              transform="rotate(-90 90 90)"
              className="cursor-pointer"
              onMouseEnter={() => setHover(slice.key)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className={`font-semibold tracking-tight text-violet-50 ${total >= 10000 ? "text-xl" : "text-2xl"}`}>
            {formatMoney(total)}
          </p>
          <p className="text-[10px] tracking-[0.18em] text-violet-300/60 uppercase">at Risk</p>
        </div>
      </div>
      <p className="min-h-5 text-center text-xs text-violet-100">
        {hover
          ? `${RULE_FAMILY_META[hover].label} · ${formatMoney(byFamily[hover] ?? 0)}${
              ringTotal ? ` · ${Math.round(((byFamily[hover] ?? 0) / ringTotal) * 100)}%` : ""
            }`
          : "\u00a0"}
      </p>
      <ul className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-violet-200/70">
        {legend.map((slice) => (
          <li key={slice.key} className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ background: slice.color }} />
            {slice.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
