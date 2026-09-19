# NemoScantron

Fraud scan bench for a three-person team. The website takes a file and a prompt,
sanitizes it, scores it against a policy pack, lets **Nemotron** reason, then
lets **Nemo** dispatch hold / notify / close. Red-team fixtures use the same
pipe. When the bench misses a labeled fraud event, a reason-based proposal
trains the ruleset.

```
Website files + prompt ─┐
                        ├─► sanitize ─► rules / policies / workflow
Red team fake fraud  ─┘                      │
                                             ▼
                                      Nemotron reasoning
                                             │
                                             ▼
                              Nemo execution ─► metrics back to the site
                                             │
                                             └── feedback ─► better rules
```

This repo is a working slice of that loop, not a platform scaffold. Nemotron is
a local engine with the same output shape you would parse from NVIDIA later.
No API key required.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build   # production check
npm run lint
```

## Try the loop

1. **Scan** — load the sample claim, or drop something from `fixtures/`.
2. **Red team** — inject `CEO wire, today` (should be fraud) and `Ordinary payroll batch` (should be clear).
3. Inject **Lookalike vendor (should miss)** — default rules will not catch it.
4. **Feedback** — accept the proposed vendor-lookalike rule.
5. Inject the lookalike event again — it should now score as fraud.

## Who owns what

Three people map onto the three swimlanes. Details and file lists: [TEAM.md](./TEAM.md).

| Person | Lane | Starter files |
| --- | --- | --- |
| A | Intake (website + sanitizer + metrics) | `src/lib/pipeline/sanitize.ts`, `src/components/console/scan-panel.tsx` |
| B | Policy (rules + Nemotron + feedback) | `src/lib/data/default-rules.ts`, `src/lib/pipeline/reasoning.ts` |
| C | Execution (red team + Nemo dispatch) | `src/lib/data/red-team-events.ts`, `src/lib/pipeline/execute.ts` |

## Layout

```
src/app/                  # Next.js routes and API
src/components/console/   # Bench UI (scan, red team, rules, feedback, team)
src/components/ui/        # shadcn primitives
src/lib/pipeline/         # sanitize → rules → reason → execute → feedback
src/lib/data/             # default ruleset + red-team catalog
fixtures/                 # files you can upload on Scan
public/workflow.png       # original sketch
```

## Plug in a real Nemotron later

Keep `reasonWithNemotron()` in `src/lib/pipeline/reasoning.ts` returning
`ReasoningResult`. Point it at NVIDIA when you have a key; leave the local
engine as the fallback so the bench still runs on a laptop.
