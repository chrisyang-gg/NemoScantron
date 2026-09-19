# NemoScantron — three-person split

The workflow sketch already has three swimlanes. Split the repo the same way.
Contracts live in `src/lib/pipeline/types.ts`. If a function returns those types,
the other two people can keep moving.

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

## Person B — Policy (brain)

**Owns:** ruleset, policies, workflow description, Nemotron reasoning, and the
reason-based feedback loop that trains those rules from red-team misses.

| File | Why it exists |
| --- | --- |
| `src/lib/data/default-rules.ts` | Starting policy pack + workflow copy |
| `src/lib/pipeline/ruleset.ts` | Signal matching |
| `src/lib/pipeline/reasoning.ts` | Nemotron-shaped verdict (local engine today) |
| `src/lib/pipeline/feedback.ts` | Miss → proposed rule |
| `src/app/api/feedback/route.ts` | Accept / reject |
| `src/app/api/rules/route.ts` | Read / upsert / reset |
| `src/components/console/rules-panel.tsx` | Policy pack UI |
| `src/components/console/feedback-panel.tsx` | Accept the lookalike-vendor miss |

**Done when:** accepting a proposal adds a rule, and the same red-team event
scores as fraud on the next inject.

Swap `reasonWithNemotron` for a live NVIDIA Nemotron call later. Keep the return
type identical.

## Person C — Execution (Nemo + adversary)

**Owns:** fake fraud events, the Nemo dispatcher, and the execution output the
website prints.

| File | Why it exists |
| --- | --- |
| `src/lib/data/red-team-events.ts` | Fixture catalog |
| `src/lib/pipeline/red-team.ts` | Lookup |
| `src/lib/pipeline/execute.ts` | hold / notify / close / escalate |
| `src/app/api/red-team/route.ts` | Inject a fixture |
| `src/components/console/red-team-panel.tsx` | Inject UI |
| `src/components/console/run-trace.tsx` | Dispatched actions + website metric |
| `fixtures/` | Files you can also drop on the Scan tab |

**Done when:** CEO-wire injects as fraud + hold/escalate, payroll stays clear,
and lookalike-vendor misses until Person B accepts feedback.

## Shared (touch only with the other two)

- `src/lib/pipeline/types.ts` — the contract
- `src/lib/pipeline/index.ts` — `runPipeline()`
- `src/lib/pipeline/store.ts` — in-memory bench (replace with a DB later)
- `src/components/console/pipeline-map.tsx` — the diagram as UI
- `src/components/console/team-board.tsx` — this split, on the Team tab

## How to work in parallel without collisions

1. Person A lands sanitize + scan UI first (empty run trace is fine).
2. Person C can inject red-team events against whatever ruleset is in git.
3. Person B iterates rules and reasoning without changing the website form.
4. Merge at `PipelineRun`. Do not pass raw strings across lanes.
