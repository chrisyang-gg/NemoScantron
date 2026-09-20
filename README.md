# NemoScantron

One-page credit-card fraud watch. Drop a `.json` transaction file (optional
notes on top), assemble the eight-file ruleset, send it to **NVIDIA Nemotron**,
and show the FILE 8 decision on a fraudometer.

There is no local or default scorer. If `NVIDIA_API_KEY` is missing, submit
returns an error.

```
optional notes + required JSON
        │
        ▼
schema scrub (extra keys dropped)
        │
        ▼
ruleset files 1–8, in order
        │
        ▼
NVIDIA Nemotron
        │
        ▼
FILE 8 JSON → website
```

A file may be submitted without notes. Notes cannot be submitted without a file.

After a score, the fraudometer sits to the left of the Nemotron decision
card. Clear is on the card. Tabs under that row switch Modify Input,
Recommendation, Transaction Map, and Enterprise Dashboard. The dashboard
keeps a slim local history of prior scores (rules, risk, timestamp,
amount) — not the full JSON. The map draws arrows from origin (billing
home or the previous charge) to each transaction destination.

## Run it locally

```bash
npm install
# edit .env and paste NVIDIA_API_KEY
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`.env` is gitignored. `.env.example` is the template.

## Ruleset

`ruleset/` holds eight prompt files. CORE files are immutable. RULES files
are what the red-team trainer may edit.

| File | Class |
|------|-------|
| `01_CORE_identity.txt` | Immutable |
| `02_CORE_execution_workflow.txt` | Immutable |
| `03_RULES_velocity_behavioral.txt` | Trainable |
| `04_RULES_geo_device.txt` | Trainable |
| `05_RULES_merchant_auth.txt` | Trainable |
| `06_RULES_attack_patterns.txt` | Trainable |
| `07_RULES_thresholds.txt` | Trainable |
| `08_CORE_output_format.txt` | Immutable |

Assembly order and constraints: `ruleset/ASSEMBLY.md`.

## JSON intake

Only `.json` files. Each record is projected onto
`src/lib/data/credit-card-transaction.schema.json`.

`fixtures/lagos-impossible-travel.json` is a full high-risk sample.
`fixtures/histories/03_card_testing_history_high_risk.json` is a five-transaction
card-testing history. Long replies from Nemotron are repaired before they reach
the page, so a cut-off or inner-quote score should not surface a raw V8 JSON error.

## Red-team training

Developers run this from the repo. It is not a website button.

1. **Nemotron** writes one credit-card case at a time (1–10). Each case
   includes a gold label, a short description, and the trick it is aiming
   at the scorer (edge, rare, hard, or a clean lookalike).
2. The CLI prints progress and writes each finished case under
   `fixtures/red-team/rounds/`.
3. A **second Nemotron** scores those cases. Gold labels are stripped
   first so the scorer is not spoon-fed the answer.
4. **Claude** sees only the RULES files 3–7 implicated by disagreements
   and gold categories — not CORE, not untouched sections. It appends
   learned-adjustment lines. CORE files stay immutable.

Needs `NVIDIA_API_KEY` for generate + score, and `ANTHROPIC_API_KEY` for
the Claude pass. Count is 1–10.

```bash
npm run red-team -- --count 4
npm run red-team -- --count 4 --apply
```

`--apply` writes Claude's lines into RULES files 3–7. Without it the
round still generates, scores, and prints drafts. `npm run train-ruleset`
is the same command.
