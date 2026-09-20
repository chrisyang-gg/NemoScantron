"use client";

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { WorldGraticule, WorldLand } from "@/components/site/world-land";
import { MAP, projectLatLon, resolvePlace, samePoint, type GeoPoint } from "@/lib/history/geo";
import { decisionPastTense, mapTone, type MapTone } from "@/lib/history/labels";
import type { HistoryEvent } from "@/lib/history/store";

type End = "origin" | "destination" | "route";

type Plot = {
  event: HistoryEvent;
  origin: GeoPoint;
  dest: GeoPoint;
  from: { x: number; y: number };
  to: { x: number; y: number };
  local: boolean;
  tone: MapTone;
};

type Hover = { plot: Plot; end: End };

const END_ENTER = 26;
const END_KEEP = 38;
const PATH_ENTER = 13;
const PATH_KEEP = 20;

const TONE = {
  normal: {
    label: "Normal",
    stroke: "#34d399",
    fill: "#6ee7b7",
    width: 1.5,
    opacity: 0.55,
    destR: 4,
    glow: null as string | null,
  },
  suspicious: {
    label: "Suspicious",
    stroke: "#fbbf24",
    fill: "#fcd34d",
    width: 2.3,
    opacity: 0.92,
    destR: 5.5,
    glow: "url(#glow-suspicious)",
  },
  malicious: {
    label: "Malicious",
    stroke: "#fb7185",
    fill: "#fda4af",
    width: 3,
    opacity: 1,
    destR: 6.5,
    glow: "url(#glow-malicious)",
  },
} as const;

const TONE_ORDER: MapTone[] = ["normal", "suspicious", "malicious"];

export function TransactionMap({ events }: { events: HistoryEvent[] }) {
  const plots = useMemo(() => layoutPlots(events), [events]);
  const [hover, setHover] = useState<Hover | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hoverRef = useRef<Hover | null>(null);

  function syncHover(next: Hover | null) {
    if (sameHover(hoverRef.current, next)) return;
    hoverRef.current = next;
    setHover(next);
  }

  function onMapPointerMove(event: PointerEvent<SVGSVGElement>) {
    const point = toSvgPoint(svgRef.current, event.clientX, event.clientY);
    syncHover(point ? pickHover(plots, point, hoverRef.current) : null);
  }

  const missing = events.length - plots.length;

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#100818] p-3">
      <div className="relative overflow-hidden rounded-xl" onPointerLeave={() => syncHover(null)}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP.width} ${MAP.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="World map of the latest file’s transaction origins and destinations"
          onPointerMove={onMapPointerMove}
        >
          <rect width={MAP.width} height={MAP.height} fill="#0c0714" />
          <g pointerEvents="none">
            <WorldGraticule />
            <WorldLand />
          </g>
          <defs>
            <filter id="glow-suspicious" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-malicious" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {plots.map((plot, index) => (
              <marker
                key={`head-${plot.event.transaction_id}-${index}`}
                id={`arrow-${index}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth={plot.tone === "malicious" ? 8 : 6.5}
                markerHeight={plot.tone === "malicious" ? 8 : 6.5}
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={TONE[plot.tone].stroke} />
              </marker>
            ))}
          </defs>
          {plots.map((plot, index) => {
            const skin = TONE[plot.tone];
            const active = hover?.plot.event.transaction_id === plot.event.transaction_id;
            return (
              <g
                key={`${plot.event.transaction_id}-${plot.event.recordedAt}-${index}`}
                pointerEvents="none"
                filter={skin.glow ?? undefined}
              >
                <path
                  d={plot.local ? loopPath(plot.to) : arcPath(plot.from, plot.to)}
                  fill="none"
                  stroke={skin.stroke}
                  strokeWidth={active ? skin.width + 0.8 : skin.width}
                  strokeOpacity={active ? 1 : skin.opacity}
                  markerEnd={plot.local ? undefined : `url(#arrow-${index})`}
                />
                <circle cx={plot.from.x} cy={plot.from.y} r="3.4" fill="#c4b5fd" fillOpacity={plot.tone === "normal" ? 0.7 : 0.95} />
                <circle
                  cx={plot.to.x}
                  cy={plot.to.y}
                  r={skin.destR}
                  fill={skin.fill}
                  stroke={skin.stroke}
                  strokeWidth={plot.tone === "normal" ? 0.6 : 1.2}
                />
              </g>
            );
          })}
        </svg>
        {hover ? <RouteTip hover={hover} /> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3 text-[11px] text-violet-300/55">
        <p>
          {events.length
            ? `Latest file · ${events.length} transaction${events.length === 1 ? "" : "s"} · ${plots.length} plotted${
                missing ? ` · ${missing} missing location` : ""
              }`
            : "Score a JSON file to plot every transaction in that file."}
        </p>
        <ul className="flex flex-wrap gap-3">
          {TONE_ORDER.map((tone) => (
            <li key={tone} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: TONE[tone].stroke }} />
              {TONE[tone].label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RouteTip({ hover }: { hover: Hover }) {
  const { plot, end } = hover;
  const event = plot.event;
  const originCountry = event.origin_country ?? countryFromLabel(plot.origin.label);
  const destCountry = event.country ?? countryFromLabel(plot.dest.label);
  const title =
    end === "origin"
      ? `Origin · ${originCountry ?? "unknown"}`
      : end === "destination"
        ? `Destination · ${destCountry ?? "unknown"}`
        : `${originCountry ?? "origin"} → ${destCountry ?? "destination"}`;

  return (
    <aside className="pointer-events-none absolute right-4 bottom-4 z-10 w-[22rem] max-w-[calc(100%-2rem)] rounded-xl border border-violet-400/25 bg-[#140c22]/96 px-3.5 py-3 text-xs text-violet-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] tracking-[0.16em] text-violet-300/70 uppercase">{title}</p>
      <p className="mt-1 text-[11px] tracking-[0.14em] uppercase" style={{ color: TONE[plot.tone].fill }}>
        {TONE[plot.tone].label}
      </p>
      <dl className="mt-2 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5">
        <Row label="Origin">{placeLine(event.origin_city, originCountry, plot.origin.label)}</Row>
        <Row label="Destination">{placeLine(event.city, destCountry, plot.dest.label)}</Row>
        <Row label="Timestamp">{event.timestamp}</Row>
        <Row label="Transaction">{event.transaction_id}</Row>
        <Row label="Decision">{decisionPastTense(event.decision)}</Row>
        <Row label="Risk score">
          {event.risk_score.toFixed(3)} ({Math.round(event.risk_score * 100)})
        </Row>
        <Row label="Amount">{event.amount == null ? "—" : event.amount.toFixed(2)}</Row>
        <Row label="Merchant risk">
          {event.merchant_risk_score == null ? "—" : event.merchant_risk_score.toFixed(3)}
        </Row>
        <Row label="Rules">{event.rules_triggered.length ? event.rules_triggered.join(", ") : "—"}</Row>
      </dl>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-violet-300/55">{label}</dt>
      <dd className="min-w-0 truncate text-violet-50">{children}</dd>
    </>
  );
}

function layoutPlots(events: HistoryEvent[]): Plot[] {
  const raw = events
    .map(toPlot)
    .filter((item): item is Plot => Boolean(item))
    .sort((a, b) => TONE_ORDER.indexOf(a.tone) - TONE_ORDER.indexOf(b.tone));

  const buckets = new Map<string, number>();
  return raw.map((plot) => {
    const key = `${plot.to.x.toFixed(0)}:${plot.to.y.toFixed(0)}`;
    const index = buckets.get(key) ?? 0;
    buckets.set(key, index + 1);
    if (index === 0) return plot;
    const angle = (index * 2.4) % (Math.PI * 2);
    const radius = 5 + (index % 4) * 3;
    const to = { x: plot.to.x + Math.cos(angle) * radius, y: plot.to.y + Math.sin(angle) * radius };
    const from = plot.local ? to : plot.from;
    return { ...plot, from, to };
  });
}

function toPlot(event: HistoryEvent): Plot | null {
  const dest =
    resolvePlace({
      latitude: event.latitude,
      longitude: event.longitude,
      city: event.city,
      country: event.country,
    }) ??
    resolvePlace({
      latitude: event.origin_latitude,
      longitude: event.origin_longitude,
      city: event.origin_city,
      country: event.origin_country,
    });
  if (!dest) return null;
  const origin =
    resolvePlace({
      latitude: event.origin_latitude,
      longitude: event.origin_longitude,
      city: event.origin_city,
      country: event.origin_country,
    }) ?? dest;
  const local = samePoint(origin, dest);
  return {
    event,
    origin,
    dest,
    from: projectLatLon(origin.lat, origin.lon),
    to: projectLatLon(dest.lat, dest.lon),
    local,
    tone: mapTone(event),
  };
}

function pickHover(plots: Plot[], point: { x: number; y: number }, prev: Hover | null): Hover | null {
  if (prev) {
    const keep = keepHover(prev, point);
    if (keep) return keep;
  }

  let bestEnd: Hover | null = null;
  let bestEndDist = END_ENTER;
  for (const plot of plots) {
    const fromDist = Math.hypot(point.x - plot.from.x, point.y - plot.from.y);
    const toDist = Math.hypot(point.x - plot.to.x, point.y - plot.to.y);
    if (fromDist < bestEndDist) {
      bestEndDist = fromDist;
      bestEnd = { plot, end: "origin" };
    }
    if (toDist < bestEndDist) {
      bestEndDist = toDist;
      bestEnd = { plot, end: "destination" };
    }
  }
  if (bestEnd) return bestEnd;

  let bestPlot: Plot | null = null;
  let bestPathDist = PATH_ENTER;
  for (const plot of plots) {
    const pathDist = plot.local
      ? Math.hypot(point.x - plot.to.x, point.y - plot.to.y)
      : distanceToArc(point, plot.from, plot.to);
    if (pathDist < bestPathDist) {
      bestPathDist = pathDist;
      bestPlot = plot;
    }
  }
  return bestPlot ? { plot: bestPlot, end: "route" } : null;
}

function keepHover(prev: Hover, point: { x: number; y: number }): Hover | null {
  if (prev.end === "origin") {
    return Math.hypot(point.x - prev.plot.from.x, point.y - prev.plot.from.y) < END_KEEP ? prev : null;
  }
  if (prev.end === "destination") {
    return Math.hypot(point.x - prev.plot.to.x, point.y - prev.plot.to.y) < END_KEEP ? prev : null;
  }
  const dist = prev.plot.local
    ? Math.hypot(point.x - prev.plot.to.x, point.y - prev.plot.to.y)
    : distanceToArc(point, prev.plot.from, prev.plot.to);
  return dist < PATH_KEEP ? prev : null;
}

function sameHover(left: Hover | null, right: Hover | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.end === right.end &&
    left.plot.event.transaction_id === right.plot.event.transaction_id &&
    left.plot.event.recordedAt === right.plot.event.recordedAt
  );
}

function toSvgPoint(svg: SVGSVGElement | null, clientX: number, clientY: number) {
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const mapped = point.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

function distanceToArc(point: { x: number; y: number }, from: { x: number; y: number }, to: { x: number; y: number }) {
  const control = arcControl(from, to);
  let nearest = Infinity;
  for (let step = 0; step <= 24; step += 1) {
    const t = step / 24;
    const rest = 1 - t;
    const x = rest * rest * from.x + 2 * rest * t * control.x + t * t * to.x;
    const y = rest * rest * from.y + 2 * rest * t * control.y + t * t * to.y;
    nearest = Math.min(nearest, Math.hypot(point.x - x, point.y - y));
  }
  return nearest;
}

function placeLine(city: string | null, country: string | null, fallback: string) {
  if (city && country) return `${city}, ${country}`;
  return country || city || fallback;
}

function countryFromLabel(label: string) {
  const parts = label.split(",").map((part) => part.trim());
  return parts[parts.length - 1] || null;
}

function arcControl(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const offset = Math.min(90, len * 0.28);
  return {
    x: (from.x + to.x) / 2 - (dy / len) * offset,
    y: (from.y + to.y) / 2 + (dx / len) * offset,
  };
}

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const control = arcControl(from, to);
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

function loopPath(point: { x: number; y: number }) {
  return `M ${point.x} ${point.y} c 16 -18 22 8 0 10`;
}
