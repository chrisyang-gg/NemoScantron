"use client";

import { useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import {
  RULE_FAMILY_META,
  RULE_IDS,
  ruleFamily,
  ruleHover,
  ruleHue,
  type RuleFamily,
} from "@/lib/history/rules";

const COLS = 5;
const CELL = 34;
const MAX_BAR = 50;
const ELEVATION = (62 * Math.PI) / 180;
const DEFAULT_YAW = Math.PI / 4;
const YAW_PER_PIXEL = 0.008;

type Vec3 = { x: number; y: number; z: number };
type Hover = { id: string; x: number; y: number };

export function RuleBarGrid({ counts }: { counts: Record<string, number> }) {
  const extras = Object.keys(counts).filter((id) => !RULE_IDS.includes(id as (typeof RULE_IDS)[number]));
  const ids = [...RULE_IDS, ...extras];
  const rows = Math.ceil(ids.length / COLS);
  const max = Math.max(1, ...Object.values(counts));
  const view = useMemo(() => viewBoxFor(rows), [rows]);
  const families = usedFamilies(ids);

  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [hover, setHover] = useState<Hover | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; yaw: number; moved: boolean } | null>(null);

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    dragRef.current = { x: event.clientX, yaw, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 3) return;
    drag.moved = true;
    setDragging(true);
    setHover(null);
    setYaw(drag.yaw + dx * YAW_PER_PIXEL);
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setYaw((value) => value - 0.12);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setYaw((value) => value + 0.12);
    }
  }

  const cells = ids.map((id, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const count = counts[id] ?? 0;
    return {
      id,
      count,
      col,
      row,
      bar: (count / max) * MAX_BAR,
      faces: cellFaces(col, row, rows, (count / max) * MAX_BAR, id, yaw, view),
    };
  });

  return (
    <div className="relative overflow-hidden">
      <svg
        viewBox={`0 0 ${view.width} ${view.height}`}
        className={`mx-auto block h-auto w-full max-w-full touch-none select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        tabIndex={0}
        aria-label="Rule detection grid. Drag sideways to rotate from above."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {cells
          .slice()
          .sort((a, b) => averageDepth(a.faces) - averageDepth(b.faces))
          .map((cell) => (
            <g
              key={cell.id}
              onPointerEnter={(event) => {
                if (dragRef.current?.moved) return;
                const tip = ruleHover(cell.id, cell.count);
                if (!tip) {
                  setHover(null);
                  return;
                }
                const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                setHover({
                  id: cell.id,
                  x: event.clientX - (box?.left ?? 0),
                  y: event.clientY - (box?.top ?? 0),
                });
              }}
              onPointerMove={(event) => {
                if (!hover || hover.id !== cell.id || dragRef.current?.moved) return;
                const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                setHover({
                  id: cell.id,
                  x: event.clientX - (box?.left ?? 0),
                  y: event.clientY - (box?.top ?? 0),
                });
              }}
              onPointerLeave={() => {
                if (hover?.id === cell.id) setHover(null);
              }}
            >
              {cell.faces
                .slice()
                .sort((a, b) => a.depth - b.depth)
                .map((face) => (
                  <polygon
                    key={face.key}
                    points={face.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill={face.fill}
                    stroke={face.stroke}
                    strokeWidth="0.6"
                  />
                ))}
            </g>
          ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-violet-200/75">
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
        <div className="flex items-center gap-3 text-[11px] text-violet-300/55">
          <span>Drag sideways to rotate. View stays from above.</span>
          {Math.abs(yaw - DEFAULT_YAW) > 0.04 ? (
            <button
              type="button"
              className="text-violet-200/80 underline-offset-2 hover:text-violet-100 hover:underline"
              onClick={() => setYaw(DEFAULT_YAW)}
            >
              Reset view
            </button>
          ) : null}
        </div>
      </div>
      {detectedTip(hover, counts)}
    </div>
  );
}

function viewBoxFor(rows: number) {
  const radius = Math.hypot(((COLS - 1) * CELL) / 2, ((rows - 1) * CELL) / 2) + CELL * 0.75;
  const width = radius * 2 + 80;
  const height = radius * 2 * Math.cos(ELEVATION) + MAX_BAR * Math.sin(ELEVATION) * 2 + 80;
  return {
    width,
    height,
    cx: width / 2,
    cy: height / 2 + MAX_BAR * Math.sin(ELEVATION) * 0.2,
  };
}

function cellFaces(
  col: number,
  row: number,
  rows: number,
  bar: number,
  id: string,
  yaw: number,
  view: { cx: number; cy: number },
) {
  const half = CELL * 0.42;
  const x = (col - (COLS - 1) / 2) * CELL;
  const z = (row - (rows - 1) / 2) * CELL;
  const top = Math.max(0, bar);
  const hue = ruleHue(id);

  const corners = {
    sw: { x: x - half, y: 0, z: z + half },
    se: { x: x + half, y: 0, z: z + half },
    ne: { x: x + half, y: 0, z: z - half },
    nw: { x: x - half, y: 0, z: z - half },
    swt: { x: x - half, y: top, z: z + half },
    set: { x: x + half, y: top, z: z + half },
    net: { x: x + half, y: top, z: z - half },
    nwt: { x: x - half, y: top, z: z - half },
  };

  const faces =
    top > 1
      ? [
          { key: "s", points: [corners.sw, corners.se, corners.set, corners.swt] },
          { key: "e", points: [corners.se, corners.ne, corners.net, corners.set] },
          { key: "n", points: [corners.ne, corners.nw, corners.nwt, corners.net] },
          { key: "w", points: [corners.nw, corners.sw, corners.swt, corners.nwt] },
          { key: "t", points: [corners.nwt, corners.net, corners.set, corners.swt] },
        ]
      : [{ key: "t", points: [corners.nw, corners.ne, corners.se, corners.sw] }];

  return faces.map((face) => {
    const projected = face.points.map((point) => project(point, yaw, view));
    const lit = lightFor(face.points);
    const isTop = face.key === "t";
    return {
      key: `${id}-${face.key}`,
      points: projected,
      depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
      fill: `hsl(${hue} ${isTop ? 78 : 70}% ${isTop ? 28 + lit * 42 : 22 + lit * 28}% / ${top > 1 ? 1 : 0.22})`,
      stroke: `hsl(${hue} 60% 78% / ${top > 1 ? 0.35 : 0.28})`,
    };
  });
}

function project(point: Vec3, yaw: number, view: { cx: number; cy: number }) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const rx = point.x * cos + point.z * sin;
  const rz = -point.x * sin + point.z * cos;
  return {
    x: view.cx + rx,
    y: view.cy + rz * Math.cos(ELEVATION) - point.y * Math.sin(ELEVATION),
    depth: rz * Math.sin(ELEVATION) + point.y * Math.cos(ELEVATION),
  };
}

function lightFor(points: Vec3[]) {
  const a = sub(points[1], points[0]);
  const b = sub(points[2], points[0]);
  const normal = normalize(cross(a, b));
  return Math.max(0.2, normal.x * -0.28 + normal.y * 0.88 + normal.z * 0.22);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function normalize(value: Vec3): Vec3 {
  const length = Math.hypot(value.x, value.y, value.z) || 1;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

function averageDepth(faces: { depth: number }[]) {
  if (!faces.length) return 0;
  return faces.reduce((sum, face) => sum + face.depth, 0) / faces.length;
}

function detectedTip(hover: Hover | null, counts: Record<string, number>) {
  if (!hover) return null;
  const tip = ruleHover(hover.id, counts[hover.id] ?? 0);
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-[16rem] rounded-lg border border-violet-400/30 bg-[#140c22]/95 px-2.5 py-1.5 text-xs text-violet-50"
      style={{ left: hover.x + 8, top: Math.max(8, hover.y - 8) }}
    >
      <p className="font-medium">{tip.id}</p>
      <p className="text-violet-200/70">{tip.name}</p>
      <p>{tip.count} detections</p>
    </div>
  );
}

function usedFamilies(ids: string[]): RuleFamily[] {
  const seen = new Set(ids.map(ruleFamily));
  return (Object.keys(RULE_FAMILY_META) as RuleFamily[]).filter((family) => seen.has(family));
}
