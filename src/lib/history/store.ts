import { bandFor, type GaugeBand } from "@/lib/gauge";
import type { NemotronAnalysis } from "@/lib/nemotron/types";

export const HISTORY_STORAGE_KEY = "nemoscantron.history.v1";
const MAX_EVENTS = 240;

export type HistoryEvent = {
  recordedAt: string;
  timestamp: string;
  risk_score: number;
  decision: string;
  transaction_id: string;
  merchant_risk_score: number | null;
  rules_triggered: string[];
  amount: number | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  origin_city: string | null;
  origin_country: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
};

export function loadHistory(): HistoryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEvent[];
    return Array.isArray(parsed) ? parsed.filter(isEvent) : [];
  } catch {
    return [];
  }
}

export function saveHistory(events: HistoryEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  window.dispatchEvent(new Event("nemoscantron-history"));
}

const EMPTY_HISTORY: HistoryEvent[] = [];
let cachedRaw = "";
let cachedEvents: HistoryEvent[] = EMPTY_HISTORY;

export function getServerHistorySnapshot(): HistoryEvent[] {
  return EMPTY_HISTORY;
}

export function getHistorySnapshot(): HistoryEvent[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "";
  if (raw === cachedRaw) return cachedEvents;
  cachedRaw = raw;
  cachedEvents = loadHistory();
  return cachedEvents;
}

export function subscribeHistory(onStoreChange: () => void) {
  const onChange = () => {
    cachedRaw = "";
    onStoreChange();
  };
  window.addEventListener("storage", onChange);
  window.addEventListener("nemoscantron-history", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("nemoscantron-history", onChange);
  };
}

type Place = {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function appendScoredEvents(
  records: Record<string, unknown>[],
  analyses: NemotronAnalysis[],
  existing: HistoryEvent[],
): HistoryEvent[] {
  const byId = new Map(records.map((record) => [String(record.transaction_id ?? ""), record]));
  const pairs = analyses
    .map((analysis) => ({ analysis, record: byId.get(analysis.transaction_id) }))
    .sort((a, b) => {
      const left = String(a.record?.timestamp ?? a.analysis.analysis_timestamp);
      const right = String(b.record?.timestamp ?? b.analysis.analysis_timestamp);
      return Date.parse(left) - Date.parse(right) || left.localeCompare(right);
    });

  const next = [...existing];
  const stamp = new Date().toISOString();
  let previous: Place | null = null;
  for (const pair of pairs) {
    const event = eventFrom(pair.analysis, pair.record, stamp, previous);
    next.push(event);
    previous = {
      city: event.city,
      country: event.country,
      latitude: event.latitude,
      longitude: event.longitude,
    };
  }
  return next.slice(-MAX_EVENTS);
}

export function eventFrom(
  analysis: NemotronAnalysis,
  record: Record<string, unknown> | undefined,
  recordedAt: string,
  previousDest?: Place | null,
): HistoryEvent {
  const merchant = asRecord(record?.merchant);
  const location = asRecord(record?.location);
  const account = asRecord(record?.account);
  const dest = {
    city: stringOrNull(location.transaction_city ?? merchant.merchant_city),
    country: stringOrNull(location.transaction_country ?? merchant.merchant_country),
    latitude: numberOrNull(location.latitude),
    longitude: numberOrNull(location.longitude),
  };
  const home: Place = {
    city: null,
    country: stringOrNull(account.billing_country ?? location.ip_country),
    latitude: null,
    longitude: null,
  };
  if (!hasPlace(dest) && hasPlace(home)) {
    dest.country = home.country;
  }
  const origin = travelOrigin(previousDest, home, dest);
  return {
    recordedAt,
    timestamp: String(record?.timestamp ?? analysis.analysis_timestamp),
    risk_score: analysis.risk_score,
    decision: analysis.decision,
    transaction_id: analysis.transaction_id,
    merchant_risk_score: numberOrNull(merchant.merchant_risk_score),
    rules_triggered: analysis.rules_triggered,
    amount: numberOrNull(record?.amount),
    ...dest,
    origin_city: origin?.city ?? null,
    origin_country: origin?.country ?? null,
    origin_latitude: origin?.latitude ?? null,
    origin_longitude: origin?.longitude ?? null,
  };
}

export function ruleCounts(events: HistoryEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    for (const rule of event.rules_triggered) {
      counts[rule] = (counts[rule] ?? 0) + 1;
    }
  }
  return counts;
}

export function riskBands(events: HistoryEvent[]): Record<GaugeBand, number> {
  const bands: Record<GaugeBand, number> = { safe: 0, maybe: 0, unsafe: 0 };
  for (const event of events) {
    bands[bandFor(event.risk_score * 100)] += 1;
  }
  return bands;
}

export function scoresByTimestamp(events: HistoryEvent[]): { timestamp: string; score: number }[] {
  const sums = new Map<string, number>();
  for (const event of events) {
    const key = event.timestamp || event.recordedAt;
    sums.set(key, (sums.get(key) ?? 0) + event.risk_score);
  }
  return [...sums.entries()]
    .map(([timestamp, score]) => ({ timestamp, score }))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.timestamp.localeCompare(b.timestamp));
}

export function latestBatch(events: HistoryEvent[]): HistoryEvent[] {
  if (!events.length) return [];
  let latest = events[0].recordedAt;
  for (const event of events) {
    if (event.recordedAt > latest) latest = event.recordedAt;
  }
  return events.filter((event) => event.recordedAt === latest);
}

function hasPlace(place: Place) {
  return Boolean(place.city || place.country || place.latitude != null);
}

function sameCountry(left: Place, right: Place) {
  const a = left.country?.trim().toUpperCase();
  const b = right.country?.trim().toUpperCase();
  return Boolean(a && b && a === b);
}

function travelOrigin(previous: Place | null | undefined, home: Place, dest: Place): Place {
  if (previous && hasPlace(previous) && !sameCountry(previous, dest)) return previous;
  if (previous && hasPlace(previous) && (previous.city || dest.city) && previous.city !== dest.city) {
    return previous;
  }
  if (hasPlace(home) && !sameCountry(home, dest)) return home;
  if (hasPlace(dest)) return dest;
  return home;
}

function isEvent(value: unknown): value is HistoryEvent {
  return Boolean(value && typeof value === "object" && "transaction_id" in value && "risk_score" in value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function stringOrNull(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}
