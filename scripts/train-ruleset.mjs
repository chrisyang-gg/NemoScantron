#!/usr/bin/env node
/**
 * Red-team one ruleset training round.
 *
 *   npm run dev
 *   npm run train-ruleset
 *   npm run train-ruleset -- --apply
 */

const base = process.env.NEMOSCANTRON_URL ?? "http://127.0.0.1:43127";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const countIndex = args.indexOf("--count");
const count = countIndex >= 0 ? Number(args[countIndex + 1]) : 4;

const response = await fetch(`${base}/api/train-ruleset`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apply, count }),
});

const payload = await response.json();
if (!response.ok) {
  console.error(payload);
  process.exit(1);
}

console.log(JSON.stringify(payload, null, 2));
if (!apply) {
  console.error("\nRe-run with --apply to write learned adjustments into RULES files 3–7.");
}
