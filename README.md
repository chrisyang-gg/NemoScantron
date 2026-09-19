# NemoScantron

Fraud scan bench for a three-person team. The website takes a file and a prompt,
sanitizes it, scores it against a policy pack, lets **Nemotron** reason, then
lets **Nemo** dispatch hold / notify / close.

The **red team is an AI agent**. It reads the live ruleset and writes a
synthetic fraud (or clean-control) document. The **feedback loop is also an AI
agent**. When the adversary and Nemotron disagree, it writes the miss rationale
and a proposed rule.

```
Website files + prompt ─┐
                        ├─► sanitize ─► rules / policies / workflow
AI red team (Nemotron)┘                      │
                                             ▼
                                      Nemotron reasoning
                                             │
                                             ▼
                              Nemo execution ─► metrics back to the site
                                             │
                                             └── AI feedback ─► better rules
```

Both agents use the same JSON contract (`src/lib/ai/engine.ts`). With
`NVIDIA_API_KEY` they call NVIDIA Nemotron. Without a key they use a local
Nemotron-compatible fallback so the bench still runs on a laptop.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add NVIDIA_API_KEY
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build
npm run lint
```

## Try the loop

1. **Scan** — load the sample claim, or drop something from `fixtures/`.
2. **Red team** — generate **Evade the current pack**. It should miss.
3. **Feedback** — read the agent's reasoning, accept the proposed rule.
4. **Replay last attack** — same payload, now fraud + hold/escalate.
5. Generate again — the adversary will try to dodge the new rule too.

## Who owns what

Details: [TEAM.md](./TEAM.md).

| Person | Lane | Starter files |
| --- | --- | --- |
| A | Intake | `src/lib/pipeline/sanitize.ts`, `src/components/console/scan-panel.tsx` |
| B | Policy + AI feedback | `src/lib/ai/feedback-agent.ts`, `src/lib/pipeline/reasoning.ts` |
| C | AI red team + Nemo | `src/lib/ai/red-team-agent.ts`, `src/lib/pipeline/execute.ts` |

## Layout

```
src/app/                  # Next.js routes and API
src/components/console/   # Bench UI
src/lib/ai/               # Nemotron client, red-team agent, feedback agent
src/lib/pipeline/         # sanitize → rules → reason → execute
src/lib/data/             # default ruleset + attack-family briefs
fixtures/                 # files you can upload on Scan
```
