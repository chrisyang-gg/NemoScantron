# NemoScantron — three-person split

This is a website. Person A owns the public pages. B and C plug into the same
pipe through `/lab`.

Contracts: `src/lib/pipeline/types.ts`. AI agents: `src/lib/ai/engine.ts`.

## Person A — Intake (the website)

**Owns:** the public site, file/prompt intake, sanitizing, and writing metrics
back onto the page.

| File | Why it exists |
| --- | --- |
| `src/components/site/header.tsx` | Site nav |
| `src/components/site/home-page.tsx` | Homepage |
| `src/components/site/scan-view.tsx` | `/scan` |
| `src/lib/pipeline/sanitize.ts` | Strip HTML, mask PAN/SSN/email |
| `src/app/api/scan/route.ts` | Website → pipeline |

**Done when:** `/scan` takes a pasted email and shows a risk score on the same
page.

## Person B — Policy (brain + AI feedback)

**Owns:** ruleset, Nemotron scoring, and the AI feedback agent on `/lab`.

| File | Why it exists |
| --- | --- |
| `src/lib/data/default-rules.ts` | Starting policy pack |
| `src/lib/pipeline/reasoning.ts` | Nemotron-shaped verdict |
| `src/lib/ai/feedback-agent.ts` | Miss → reasoned proposal |
| `src/components/console/feedback-panel.tsx` | Review UI on `/lab` |

**Done when:** accepting a proposal, then **Replay last attack**, flips the
site metric to fraud.

## Person C — Execution (AI red team + Nemo)

**Owns:** the `/lab` adversary, Nemo dispatch, and execution output.

| File | Why it exists |
| --- | --- |
| `src/lib/ai/red-team-agent.ts` | Generate + evade live signals |
| `src/app/lab/page.tsx` | Lab website |
| `src/lib/pipeline/execute.ts` | hold / notify / close / escalate |

**Done when:** “Evade the current pack” misses on `/lab`, and a clean-control
stays clear.
