# NemoScantron

A **website** for payment-file fraud scans. You submit a file and a prompt.
The site sanitizes it, scores it against a policy pack, lets **Nemotron**
reason, then **Nemo** writes a risk score and a short description back onto
the page.

The **lab** on the same site runs an AI red team (fake fraud against the live
ruleset) and an AI feedback loop that trains the pack from misses.

```
Website files + prompt ─┐
                        ├─► sanitize ─► rules / policies / workflow
AI red team (lab)     ┘                      │
                                             ▼
                                      Nemotron reasoning
                                             │
                                             ▼
                         Nemo ─► metrics / description on the website
                                             │
                                             └── AI feedback ─► better rules
```

## Pages

| Path | What it is |
| --- | --- |
| `/` | Public homepage |
| `/scan` | Website intake — files, prompt, site metric |
| `/how-it-works` | Pipeline + three-person split |
| `/lab` | AI red team, feedback, rules |

## Run it

```bash
npm install
cp .env.example .env.local   # optional: NVIDIA_API_KEY
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

With `NVIDIA_API_KEY` the lab agents call NVIDIA Nemotron. Without a key they
use a local Nemotron-compatible engine.

## Who owns what

[TEAM.md](./TEAM.md)

| Person | Lane | Starter files |
| --- | --- | --- |
| A | This website (intake + metrics) | `src/components/site/`, `src/app/scan/` |
| B | Policy + AI feedback | `src/lib/ai/feedback-agent.ts` |
| C | AI red team + Nemo | `src/lib/ai/red-team-agent.ts`, `src/app/lab/` |
