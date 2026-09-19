# NemoScantron — three-person split

The public website is intake only. Scoring is NVIDIA Nemotron. Red-team
training is a developer command.

## Person A — Website

**Owns:** the public page `/`. JSON file in (optional notes). Nemotron
decision out.

| File | Why it exists |
| --- | --- |
| `src/components/site/` | Header, composer, fraudometer, analysis card |
| `src/lib/gauge.ts` | Green / amber / red cutoffs |
| `src/lib/pipeline/schema-sanitize.ts` | JSON type + schema field scrub |
| `src/lib/data/credit-card-transaction.schema.json` | Allowed transaction fields |

## Person B — Policy

**Owns:** the eight-file ruleset and Nemotron scoring.

| File | Why it exists |
| --- | --- |
| `ruleset/` | CORE (immutable) and RULES (trainable) prompt files |
| `src/lib/ruleset/assemble.ts` | Concatenate files + notes + JSON |
| `src/lib/nemotron/` | Call NVIDIA Nemotron and parse FILE 8 output |
| `src/lib/feedback/train-ruleset.ts` | Miss → append-only RULES edits |

## Person C — Developer training

**Owns:** the red team that generates schema-shaped fraud. Not a page.

| File | Why it exists |
| --- | --- |
| `src/lib/red-team/` | Synthetic fraud cases |
| `src/app/api/train-ruleset/route.ts` | Training endpoint |
| `scripts/train-ruleset.mjs` | `npm run train-ruleset` |
