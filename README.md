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

Needs the same `NVIDIA_API_KEY`. The red team generates schema-shaped
synthetic fraud, Nemotron scores it, and a feedback agent may append
learnings only to RULES files 3–7.

```bash
npm run dev
npm run train-ruleset
npm run train-ruleset -- --apply
```
