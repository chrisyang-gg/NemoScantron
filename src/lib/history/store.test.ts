import { latestBatch, riskBands, ruleCounts, scoresByTimestamp, type HistoryEvent } from "./store";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const events: HistoryEvent[] = [
  {
    recordedAt: "2026-09-19T20:00:00Z",
    timestamp: "2026-09-19T14:10:00Z",
    risk_score: 0.1,
    decision: "approve",
    transaction_id: "a",
    merchant_risk_score: 0.08,
    rules_triggered: [],
    amount: 18.42,
    city: "Pittsburgh",
    country: "US",
    latitude: null,
    longitude: null,
    origin_city: null,
    origin_country: "US",
    origin_latitude: null,
    origin_longitude: null,
  },
  {
    recordedAt: "2026-09-19T20:00:01Z",
    timestamp: "2026-09-19T14:10:00Z",
    risk_score: 0.8,
    decision: "decline",
    transaction_id: "b",
    merchant_risk_score: 0.4,
    rules_triggered: ["VB-001", "MA-005"],
    amount: 1.13,
    city: "Austin",
    country: "US",
    latitude: null,
    longitude: null,
    origin_city: "Pittsburgh",
    origin_country: "US",
    origin_latitude: null,
    origin_longitude: null,
  },
];

assert(ruleCounts(events)["VB-001"] === 1, "rule count");
assert(riskBands(events).unsafe === 1 && riskBands(events).safe === 1, "bands");
const series = scoresByTimestamp(events);
assert(series.length === 1 && Math.abs(series[0].score - 0.9) < 0.001, "timestamp sum");
assert(latestBatch(events).map((event) => event.transaction_id).join() === "b", "latest file only");
console.log("history store tests passed");
