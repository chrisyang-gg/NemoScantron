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

export function appendScoredEvents(
  records: Record<string, unknown>[],
  analyses: NemotronAnalysis[],
  existing: HistoryEvent[],
): HistoryEvent[] {
  const byId = new Map(records.map((record) => [String(record.transaction_id ?? ""), record]));
  const next = [...existing];
  const stamp = new Date().toISOString();
  for (const analysis of analyses) {
    const record = byId.get(analysis.transaction_id);
    next.push(eventFrom(analysis, record, stamp));
  }
  return next.slice(-MAX_EVENTS);
}

export function eventFrom(
  analysis: NemotronAnalysis,
  record: Record<string, unknown> | undefined,
  recordedAt: string,
): HistoryEvent {
  const merchant = asRecord(record?.merchant);
  const location = asRecord(record?.location);
  return {
    recordedAt,
    timestamp: String(record?.timestamp ?? analysis.analysis_timestamp),
    risk_score: analysis.risk_score,
    decision: analysis.decision,
    transaction_id: analysis.transaction_id,
    merchant_risk_score: numberOrNull(merchant.merchant_risk_score),
    rules_triggered: analysis.rules_triggered,
    amount: numberOrNull(record?.amount),
    city: stringOrNull(location.transaction_city ?? merchant.merchant_city),
    country: stringOrNull(location.transaction_country ?? merchant.merchant_country),
    latitude: numberOrNull(location.latitude),
    longitude: numberOrNull(location.longitude),
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
