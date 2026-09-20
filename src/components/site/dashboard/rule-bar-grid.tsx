"use client";

import { useMemo, useState } from "react";
import {
  RULE_FAMILY_META,
  RULE_IDS,
  ruleFamily,
  ruleHue,
  ruleName,
  type RuleFamily,
} from "@/lib/history/rules";

const COLS = 5;
const TILE_W = 46;
const TILE_H = 23;
const MAX_BAR = 64;
const PAD_X = 36;
const PAD_Y = 28;

export function RuleBarGrid({ counts }: { counts: Record<string, number> }) {
  const extras = Object.keys(counts).filter((id) => !RULE_IDS.includes(id as (typeof RULE_IDS)[number]));
  const ids = [...RULE_IDS, ...extras];
  const rows = Math.ceil(ids.length / COLS);
  const max = Math.max(1, ...Object.values(counts));
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);

  const layout = useMemo(() => gridLayout(rows), [rows]);
  const families = usedFamilies(ids);

  return (
    <div className="relative overflow-hidden">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto block h-auto w-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Rule detection grid"
      >
        {ids
          .map((id, index) => ({ id, index, col: index % COLS, row: Math.floor(index / COLS) }))
          .sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col)
          .map(({ id, col, row }) => {
            const count = counts[id] ?? 0;
            const bar = (count / max) * MAX_BAR;
            const base = layout.origin(col, row, 0);
            const top = layout.origin(col, row, bar);
            const tint = colorsForRule(id);
            return (
              <g
                key={id}
                onMouseEnter={(event) => {
                  const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  setHover({
                    id,
                    x: event.clientX - (box?.left ?? 0),
                    y: event.clientY - (box?.top ?? 0),
                  });
                }}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                <polygon points={diamond(base.x, base.y)} fill={tint.base} stroke={tint.stroke} />
                {bar > 1 ? (
                  <>
                    <polygon
                      points={`${base.x - TILE_W / 2},${base.y} ${top.x - TILE_W / 2},${top.y} ${top.x},${top.y + TILE_H / 2} ${base.x},${base.y + TILE_H / 2}`}
                      fill={tint.left}
                    />
                    <polygon
                      points={`${base.x + TILE_W / 2},${base.y} ${top.x + TILE_W / 2},${top.y} ${top.x},${top.y + TILE_H / 2} ${base.x},${base.y + TILE_H / 2}`}
                      fill={tint.right}
                    />
                    <polygon points={diamond(top.x, top.y)} fill={tint.top} stroke={tint.stroke} />
                  </>
                ) : null}
              </g>
            );
          })}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[11px] text-violet-200/75">
        {families.map((family) => (
          <li key={family} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: `hsl(${RULE_FAMILY_META[family].hue} 72% 58%)` }}
            />
            {RULE_FAMILY_META[family].label}
          </li>
        ))}
      </ul>
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[16rem] rounded-lg border border-violet-400/30 bg-[#140c22]/95 px-2.5 py-1.5 text-xs text-violet-50"
          style={{ left: hover.x + 8, top: Math.max(8, hover.y - 8) }}
        >
          <p className="font-medium">{hover.id}</p>
          <p className="text-violet-200/70">{ruleName(hover.id)}</p>
          <p>{counts[hover.id] ?? 0} detections</p>
        </div>
      ) : null}
    </div>
  );
}

function gridLayout(rows: number) {
  const minX = (0 - (rows - 1)) * (TILE_W / 2) - TILE_W / 2;
  const maxX = ((COLS - 1) - 0) * (TILE_W / 2) + TILE_W / 2;
  const minY = -MAX_BAR - TILE_H / 2;
  const maxY = ((COLS - 1) + (rows - 1)) * (TILE_H / 2) + TILE_H / 2;
  return {
    width: maxX - minX + PAD_X * 2,
    height: maxY - minY + PAD_Y * 2,
    origin(col: number, row: number, height = 0) {
      return {
        x: (col - row) * (TILE_W / 2) - minX + PAD_X,
        y: (col + row) * (TILE_H / 2) - height - minY + PAD_Y,
      };
    },
  };
}

function diamond(cx: number, cy: number) {
  return `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;
}

function colorsForRule(id: string) {
  const hue = ruleHue(id);
  return {
    left: `hsl(${hue} 72% 46%)`,
    right: `hsl(${hue} 70% 32%)`,
    top: `hsl(${hue} 78% 68%)`,
    base: `hsl(${hue} 55% 52% / 0.16)`,
    stroke: `hsl(${hue} 60% 78% / 0.45)`,
  };
}

function usedFamilies(ids: string[]): RuleFamily[] {
  const seen = new Set(ids.map(ruleFamily));
  return (Object.keys(RULE_FAMILY_META) as RuleFamily[]).filter((family) => seen.has(family));
}
