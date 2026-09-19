import { isRawJsonParseError, parseNemotronOutput, repairLooseJson } from "./parse";

function sample(overrides: Record<string, unknown> = {}) {
  return {
    transaction_id: "txn_1",
    analysis_timestamp: "2026-09-19T14:32:07Z",
    risk_score: 0.88,
    decision: "decline",
    confidence: 0.91,
    rules_triggered: ["VB-002"],
    patterns_matched: ["CARD-TESTING"],
    fraud_indicators: [
      {
        indicator: "card_testing_burst",
        severity: "high",
        detail: "Five small auths on an unknown device.",
      },
    ],
    risk_score_breakdown: {
      velocity_behavioral: 0.8,
      geo_device: 0.2,
      merchant_auth: 0.4,
      pattern_boost: 0.25,
    },
    reasoning: "Velocity on card_03 jumped after declined_attempts_last_1h of 4.",
    recommended_action: "Block the card and call the cardholder.",
    escalate_to_analyst: true,
    ruleset_versions_applied: {
      velocity_behavioral: "v1.0",
      geo_device: "v1.0",
      merchant_auth: "v1.0",
      attack_patterns: "v1.0",
      thresholds: "v1.0",
    },
    ...overrides,
  };
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const clean = parseNemotronOutput(JSON.stringify(sample()));
assert(clean[0]?.decision === "decline", "valid object should parse");

const fenced = parseNemotronOutput("```json\n" + JSON.stringify(sample()) + "\n```");
assert(fenced[0]?.transaction_id === "txn_1", "fenced JSON should parse");

const trailing = parseNemotronOutput(
  JSON.stringify(sample()).replace("}", ",}"),
);
assert(trailing[0]?.risk_score === 0.88, "trailing comma should parse");

const innerQuotes =
  '{"transaction_id":"txn_1","analysis_timestamp":"2026-09-19T14:32:07Z","risk_score":0.88,"decision":"decline","confidence":0.91,"rules_triggered":["VB-002"],"patterns_matched":["CARD-TESTING"],"fraud_indicators":[{"indicator":"burst","severity":"high","detail":"see rule "VB-002" on BIN 414720"}],"risk_score_breakdown":{"velocity_behavioral":0.8,"geo_device":0.2,"merchant_auth":0.4,"pattern_boost":0.25},"reasoning":"Pattern "CARD-TESTING" fired after amount 1.00 then 1.13","recommended_action":"Block card.","escalate_to_analyst":true,"ruleset_versions_applied":{"velocity_behavioral":"v1.0","geo_device":"v1.0","merchant_auth":"v1.0","attack_patterns":"v1.0","thresholds":"v1.0"}}';

let rawMessage = "";
try {
  JSON.parse(innerQuotes);
} catch (error) {
  rawMessage = error instanceof Error ? error.message : String(error);
}
assert(/Expected ',' or '}' after property value in JSON/i.test(rawMessage), rawMessage);
assert(isRawJsonParseError(new Error(rawMessage)), "V8 JSON errors must be recognized");

const repaired = parseNemotronOutput(innerQuotes);
assert(repaired[0]?.decision === "decline", "inner quotes should repair");
assert(repaired[0]?.reasoning.includes("CARD-TESTING"), "reasoning should keep the cited pattern");

const truncated = '{"transaction_id":"txn_cut","decision":"hold","confidence":0.7,"risk_score":0.6,"reasoning":"Cut off mid sent';
const recovered = parseNemotronOutput(truncated);
assert(recovered[0]?.decision === "hold", "truncated string should close and parse");

const two = parseNemotronOutput(
  `[${JSON.stringify(sample({ transaction_id: "a", decision: "approve", escalate_to_analyst: false }))},${JSON.stringify(sample({ transaction_id: "b" }))}`,
);
assert(two.length === 2, "array of two scores");
assert(two[0]?.decision === "approve" && two[1]?.decision === "decline", "both decisions");

const padded = "Here is the score\n" + JSON.stringify(sample({ transaction_id: "padded" }));
assert(parseNemotronOutput(padded)[0]?.transaction_id === "padded", "leading prose should be skipped");

assert(repairLooseJson(innerQuotes).includes('\\"CARD-TESTING\\"'), "repair should escape inner quotes");

let threw = false;
try {
  parseNemotronOutput("not json at all");
} catch (error) {
  threw = error instanceof Error && error.message === "Nemotron did not return JSON.";
}
assert(threw, "garbage should not leak a V8 parse error");

console.log("parse tests passed");
