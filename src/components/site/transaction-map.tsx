"use client";

import { useState, type ReactNode } from "react";
import { WorldGraticule, WorldLand } from "@/components/site/world-land";
import { GAUGE_COLORS, bandFor } from "@/lib/gauge";
import { MAP, projectLatLon, resolvePlace, samePoint, type GeoPoint } from "@/lib/history/geo";
import type { HistoryEvent } from "@/lib/history/store";

type End = "origin" | "destination" | "route";

type Route = {
  event: HistoryEvent;
  origin: GeoPoint;
  dest: GeoPoint;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

type Hover = { route: Route; end: End };

export function TransactionMap({ events }: { events: HistoryEvent[] }) {
  const routes = events.map(toRoute).filter((item): item is Route => Boolean(item));
  const [hover, setHover] = useState<Hover | null>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-[#100818] p-3">
      <svg
        viewBox={`0 0 ${MAP.width} ${MAP.height}`}
        className="h-auto w-full"
        role="img"
        aria-label="World map of transaction origin to destination"
      >
        <rect width={MAP.width} height={MAP.height} fill="#0c0714" />
        <WorldGraticule />
        <WorldLand />
        <defs>
          {routes.map((route, index) => (
            <marker
              key={`head-${route.event.transaction_id}-${index}`}
              id={`arrow-${index}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={colorFor(route)} />
            </marker>
          ))}
        </defs>
        {routes.map((route, index) => {
          const curve = arcPath(route.from, route.to);
          const active = hover?.route.event.transaction_id === route.event.transaction_id;
          return (
            <g key={`${route.event.transaction_id}-${route.event.recordedAt}-${index}`}>
              <path
                d={curve}
                fill="none"
                stroke={colorFor(route)}
                strokeWidth={active ? 3 : 1.8}
                strokeOpacity={active ? 0.95 : 0.7}
                markerEnd={`url(#arrow-${index})`}
                className="cursor-pointer"
                onMouseEnter={() => setHover({ route, end: "route" })}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={route.from.x}
                cy={route.from.y}
                r="14"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover({ route, end: "origin" })}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={route.from.x}
                cy={route.from.y}
                r={hover?.end === "origin" && active ? 6 : 3.5}
                fill="#c4b5fd"
                pointerEvents="none"
              />
              <circle
                cx={route.to.x}
                cy={route.to.y}
                r="14"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover({ route, end: "destination" })}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={route.to.x}
                cy={route.to.y}
                r={hover?.end === "destination" && active ? 7 : 4.5}
                fill={colorFor(route)}
                stroke="rgba(255,255,255,0.35)"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>
      {hover ? <RouteTip hover={hover} /> : (
        <p className="px-2 pt-2 text-[11px] text-violet-300/50">
          {routes.length
            ? "Hover either end of an arrow for origin or destination details."
            : "Score a JSON file to plot origin → destination arrows on the world map."}
        </p>
      )}
    </div>
  );
}

function RouteTip({ hover }: { hover: Hover }) {
  const { route, end } = hover;
  const event = route.event;
  const originCountry = event.origin_country ?? countryFromLabel(route.origin.label);
  const destCountry = event.country ?? countryFromLabel(route.dest.label);
  const title =
    end === "origin"
      ? `Origin · ${originCountry ?? "unknown"}`
      : end === "destination"
        ? `Destination · ${destCountry ?? "unknown"}`
        : `${originCountry ?? "origin"} → ${destCountry ?? "destination"}`;

  return (
    <aside className="pointer-events-none absolute right-4 bottom-4 w-[22rem] max-w-[calc(100%-2rem)] rounded-xl border border-violet-400/25 bg-[#140c22]/96 px-3.5 py-3 text-xs text-violet-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] tracking-[0.16em] text-violet-300/70 uppercase">{title}</p>
      <dl className="mt-2 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5">
        <Row label="Origin">{placeLine(event.origin_city, originCountry, route.origin.label)}</Row>
        <Row label="Destination">{placeLine(event.city, destCountry, route.dest.label)}</Row>
        <Row label="Timestamp">{event.timestamp}</Row>
        <Row label="Transaction">{event.transaction_id}</Row>
        <Row label="Decision">{event.decision.replaceAll("_", " ")}</Row>
        <Row label="Risk score">{event.risk_score.toFixed(3)} ({Math.round(event.risk_score * 100)})</Row>
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

function placeLine(city: string | null, country: string | null, fallback: string) {
  if (city && country) return `${city}, ${country}`;
  return country || city || fallback;
}

function countryFromLabel(label: string) {
  const parts = label.split(",").map((part) => part.trim());
  return parts[parts.length - 1] || null;
}

function toRoute(event: HistoryEvent): Route | null {
  const dest = resolvePlace({
    latitude: event.latitude,
    longitude: event.longitude,
    city: event.city,
    country: event.country,
  });
  const origin = resolvePlace({
    latitude: event.origin_latitude,
    longitude: event.origin_longitude,
    city: event.origin_city,
    country: event.origin_country ?? (dest ? null : event.country),
  });
  if (!dest || !origin || samePoint(origin, dest)) return null;
  return {
    event,
    origin,
    dest,
    from: projectLatLon(origin.lat, origin.lon),
    to: projectLatLon(dest.lat, dest.lon),
  };
}

function colorFor(route: Route) {
  return GAUGE_COLORS[bandFor(route.event.risk_score * 100)];
}

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const offset = Math.min(90, len * 0.28);
  const cx = (from.x + to.x) / 2 - (dy / len) * offset;
  const cy = (from.y + to.y) / 2 + (dx / len) * offset;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}
