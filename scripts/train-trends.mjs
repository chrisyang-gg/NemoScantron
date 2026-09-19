#!/usr/bin/env node
/**
 * Developer trend training. Talks to the running website's in-memory ruleset.
 *
 *   npm run dev
 *   npm run train-trends
 *   npm run train-trends -- --apply --brief "micro-deposits then a large pull"
 */

const base = process.env.NEMOSCANTRON_URL ?? "http://127.0.0.1:43127";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const familyIndex = args.indexOf("--family");
const briefIndex = args.indexOf("--brief");
const family = familyIndex >= 0 ? args[familyIndex + 1] : "evade";
const brief = briefIndex >= 0 ? args[briefIndex + 1] : undefined;

const response = await fetch(`${base}/api/train`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ family, brief, apply }),
});

const payload = await response.json();
if (!response.ok) {
  console.error(payload);
  process.exit(1);
}

console.log(JSON.stringify(payload, null, 2));
if (!apply && payload.feedback?.length) {
  console.error("\nRe-run with --apply to write proposed rules into the live pack.");
}
