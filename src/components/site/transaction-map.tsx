"use client";

import { useState } from "react";
import { WorldGraticule, WorldLand } from "@/components/site/world-land";
import { GAUGE_COLORS, bandFor } from "@/lib/gauge";
import { MAP, projectLatLon, resolvePlace, samePoint, type GeoPoint } from "@/lib/history/geo";
import type { HistoryEvent } from "@/lib/history/store";

type Route = {
  event: HistoryEvent;
  origin: GeoPoint;
  dest: GeoPoint;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export function TransactionMap({ events }: { events: HistoryEvent[] }) {
  const routes = events.map(toRoute).filter((item): item is Route => Boolean(item));
  const [hover, setHover] = useState<Route | null>(null);

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
          const active = hover?.event.transaction_id === route.event.transaction_id;
          return (
            <g
              key={`${route.event.transaction_id}-${route.event.recordedAt}-${index}`}
              className="cursor-pointer"
              onMouseEnter={() => setHover(route)}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={curve}
                fill="none"
                stroke={colorFor(route)}
                strokeWidth={active ? 3 : 1.8}
                strokeOpacity={active ? 0.95 : 0.7}
                markerEnd={`url(#arrow-${index})`}
              />
              <circle cx={route.from.x} cy={route.from.y} r={active ? 5 : 3.5} fill="#c4b5fd" />
              <circle
                cx={route.to.x}
                cy={route.to.y}
                r={active ? 6 : 4.5}
                fill={colorFor(route)}
                stroke="rgba(255,255,255,0.35)"
              />
            </g>
          );
        })}
      </svg>
      {hover ? (
        <p className="pointer-events-none absolute right-4 bottom-4 max-w-[28rem] rounded-lg border border-violet-400/20 bg-[#140c22]/95 px-3 py-2 text-xs text-violet-100">
          {hover.origin.label} → {hover.dest.label}
          {" · "}
          {hover.event.transaction_id}
          {" · "}
          {Math.round(hover.event.risk_score * 100)}
        </p>
      ) : (
        <p className="px-2 pt-2 text-[11px] text-violet-300/50">
          {routes.length
            ? "Arrows run from origin (home or last charge) to the transaction destination. Hover a route for details."
            : "Score a JSON file to plot origin → destination arrows on the world map."}
        </p>
      )}
    </div>
  );
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
