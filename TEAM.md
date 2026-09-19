# NemoScantron — three-person split

The public website is only intake and the score. Red-team trend training is a
developer command. The homepage is a chat composer plus a fraudometer.

## Person A — Website

**Owns:** the public page `/`. File or text history in. Risk score and
rationale out.

| File | Why it exists |
| --- | --- |
| `src/components/site/` | Pages, header, composer, fraudometer |
| `src/components/site/composer.tsx` | Text box, JSON upload / drag-drop, submit |
| `src/components/site/fraudometer.tsx` | Center risk gauge |
| `src/lib/gauge.ts` | Green / amber / red cutoffs |
| `src/lib/pipeline/sanitize.ts` | Intake cleaning |

## Person B — Policy

**Owns:** ruleset, Nemotron scoring, and the feedback agent that fires when
trend training finds a miss.

| File | Why it exists |
| --- | --- |
| `src/lib/data/default-rules.ts` | Starting pack |
| `src/lib/pipeline/reasoning.ts` | Risk score and rationale |
| `src/lib/ai/feedback-agent.ts` | Miss → proposed rule |

## Person C — Developer training

**Owns:** the AI red team that introduces new suspicious trends. Not a page.

| File | Why it exists |
| --- | --- |
| `src/lib/ai/red-team-agent.ts` | Generate a trend against the live pack |
| `src/app/api/train/route.ts` | Training endpoint |
| `scripts/train-trends.mjs` | `npm run train-trends` |

**Done when:** `npm run train-trends -- --apply` adds a rule, and a later
public scan of that pattern scores higher.
