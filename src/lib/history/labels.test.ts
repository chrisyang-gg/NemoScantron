import { decisionPastTense, mapTone } from "./labels";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(decisionPastTense("approve") === "approved", "approve");
assert(decisionPastTense("decline") === "declined", "decline");
assert(decisionPastTense("hold") === "held", "hold");
assert(decisionPastTense("flag_for_review") === "flagged for review", "flag for review");
assert(mapTone({ decision: "approve", risk_score: 0.1, rules_triggered: [] }) === "normal", "clean is normal");
assert(mapTone({ decision: "flag_for_review", risk_score: 0.5, rules_triggered: [] }) === "suspicious", "flag is suspicious");
assert(mapTone({ decision: "decline", risk_score: 0.9, rules_triggered: ["GEO-001"] }) === "malicious", "decline is malicious");

console.log("labels.test.ts ok");
