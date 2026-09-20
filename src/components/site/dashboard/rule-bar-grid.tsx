"use client";

import { useState } from "react";
import { RULE_IDS, ruleName } from "@/lib/history/rules";

export function RuleBarGrid({ counts }: { counts: Record<string, number> }) {
  const extras = Object.keys(counts).filter((id) => !RULE_IDS.includes(id as (typeof RULE_IDS)[number]));
  const ids = [...RULE_IDS, ...extras];
  const cols = 5;
  const rows = Math.ceil(ids.length / cols);
  const max = Math.max(1, ...Object.values(counts), 1);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);

  const tileW = 44;
  const tileH = 22;
  const originX = 210;
  const originY = 36;
  const maxBar = 86;

  function origin(col: number, row: number, height = 0) {
    return {
      x: originX + (col - row) * (tileW / 2),
      y: originY + (col + row) * (tileH / 2) - height,
    };
  }

  const width = 520;
  const height = originY + (cols + rows) * (tileH / 2) + 48;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Rule detection grid">
        {ids.map((id, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const count = counts[id] ?? 0;
          const bar = (count / max) * maxBar;
          const base = origin(col, row, 0);
          const top = origin(col, row, bar);
          const diamond = (cx: number, cy: number) =>
            `${cx},${cy - tileH / 2} ${cx + tileW / 2},${cy} ${cx},${cy + tileH / 2} ${cx - tileW / 2},${cy}`;
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
              <polygon points={diamond(base.x, base.y)} fill="rgba(167,139,250,0.12)" stroke="rgba(196,181,253,0.25)" />
              {bar > 1 ? (
                <>
                  <polygon
                    points={`${base.x - tileW / 2},${base.y} ${top.x - tileW / 2},${top.y} ${top.x},${top.y + tileH / 2} ${base.x},${base.y + tileH / 2}`}
                    fill="rgba(139,92,246,0.45)"
                  />
                  <polygon
                    points={`${base.x + tileW / 2},${base.y} ${top.x + tileW / 2},${top.y} ${top.x},${top.y + tileH / 2} ${base.x},${base.y + tileH / 2}`}
                    fill="rgba(91,33,182,0.55)"
                  />
                  <polygon points={diamond(top.x, top.y)} fill="rgba(196,181,253,0.85)" />
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-violet-400/30 bg-[#140c22]/95 px-2.5 py-1.5 text-xs text-violet-50"
          style={{ left: hover.x + 8, top: hover.y - 8 }}
        >
          <p className="font-medium">{hover.id}</p>
          <p className="text-violet-200/70">{ruleName(hover.id)}</p>
          <p>{counts[hover.id] ?? 0} detections</p>
        </div>
      ) : null}
    </div>
  );
}
