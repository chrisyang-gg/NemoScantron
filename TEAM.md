# NemoScantron — three-person split

The workflow sketch already has three swimlanes. Split the repo the same way.
Contracts live in `src/lib/pipeline/types.ts`. The two AI agents share
`src/lib/ai/engine.ts`.

## Person A — Intake (website)

**Owns:** the website surface, file/prompt intake, input sanitizing, and writing
metrics/descriptions back onto the site.

| File | Why it exists |
| --- | --- |
| `src/components/console/scan-panel.tsx` | Files + analyst prompt |
| `src/components/console/console-app.tsx` | Shell, tabs, metric header |
| `src/lib/pipeline/sanitize.ts` | Strip HTML, mask PAN/SSN/email, flag injection |
| `src/app/api/scan/route.ts` | Website → pipeline |
| `src/app/page.tsx` / `src/app/layout.tsx` | App chrome |

**Done when:** a pasted email or dropped `.eml` comes back as a risk score, a
short description, and a sanitizer trace.

## Person B — Policy (brain + AI feedback)

**Owns:** ruleset, policies, workflow description, Nemotron scoring, and the AI
feedback agent that trains those rules from red-team misses.

| File | Why it exists |
| --- | --- |
| `src/lib/data/default-rules.ts` | Starting policy pack + workflow copy |
| `src/lib/pipeline/ruleset.ts` | Signal matching + near-misses |
| `src/lib/pipeline/reasoning.ts` | Nemotron-shaped verdict |
| `src/lib/ai/feedback-agent.ts` | Miss → reasoned proposal |
| `src/app/api/feedback/route.ts` | Accept / reject |
| `src/components/console/feedback-panel.tsx` | Review the agent's rule |

**Done when:** accepting a proposal adds a rule, and **Replay last attack**
scores that payload as fraud.

## Person C — Execution (AI red team + Nemo)

**Owns:** the adversary that writes fake fraud against the live pack, the Nemo
dispatcher, and the execution output the website prints.

| File | Why it exists |
| --- | --- |
| `src/lib/ai/red-team-agent.ts` | Generate + evade live signals |
| `src/lib/data/attack-families.ts` | Briefs the agent is allowed to pursue |
| `src/lib/pipeline/execute.ts` | hold / notify / close / escalate |
| `src/app/api/red-team/route.ts` | Generate / replay |
| `src/components/console/red-team-panel.tsx` | Generate and dispatch UI |
| `src/components/console/run-trace.tsx` | Dispatched actions + website metric |
| `fixtures/` | Files you can also drop on the Scan tab |

**Done when:** “Evade the current pack” misses, and a clean-control stays clear.

## Shared

- `src/lib/ai/engine.ts` — NVIDIA Nemotron if `NVIDIA_API_KEY` is set, else local
- `src/lib/pipeline/types.ts` — the contract
- `src/lib/pipeline/index.ts` — `runPipeline()`
- `src/lib/pipeline/store.ts` — in-memory bench

## How to work in parallel

1. Person A lands sanitize + scan UI first.
2. Person C iterates the red-team agent against whatever ruleset is in git.
3. Person B iterates scoring and the feedback agent without changing intake.
4. Merge at `PipelineRun` / `GeneratedAttack` / `FeedbackProposal`.
