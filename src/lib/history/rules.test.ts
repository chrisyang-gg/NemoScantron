import { ruleFamily, ruleHover, ruleHue } from "./rules";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(ruleFamily("VB-002") === "velocity", "VB is velocity");
assert(ruleFamily("GEO-001") === "geo", "GEO is geo");
assert(ruleFamily("MA-005") === "merchant", "MA is merchant");
assert(ruleFamily("TH-001") === "threshold", "TH is threshold");
assert(ruleFamily("GEO-IMPOSSIBLE-TRAVEL") === "attack", "impossible travel is an attack pattern");
assert(ruleFamily("CARD-TESTING") === "attack", "card testing is an attack pattern");
assert(ruleHue("VB-001") !== ruleHue("VB-008"), "sibling velocity rules get distinct hues");
assert(Math.abs(ruleHue("VB-001") - 32) < 16, "velocity hues stay amber");
assert(Math.abs(ruleHue("GEO-001") - 196) < 16, "geo hues stay cyan");
assert(ruleHover("VB-001", 0) === null, "undetected rules stay unnamed");
assert(ruleHover("VB-001", 2)?.name === "High transaction frequency — last hour", "detected rules reveal their name");

console.log("rules.test.ts ok");
