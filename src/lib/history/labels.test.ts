import { decisionPastTense } from "./labels";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(decisionPastTense("approve") === "approved", "approve");
assert(decisionPastTense("decline") === "declined", "decline");
assert(decisionPastTense("hold") === "held", "hold");
assert(decisionPastTense("flag_for_review") === "flagged for review", "flag for review");

console.log("labels.test.ts ok");
