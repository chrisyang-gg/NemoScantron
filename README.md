# NemoScantron

One-page credit-card fraud watch. Drop a `.json` transaction file (optional
notes on top), assemble the eight-file ruleset, send it to **Nemotron**, and
show the FILE 8 decision on a fraudometer.

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
Nemotron (or local executor if no API key)
        │
        ▼
FILE 8 JSON → website
```

A file may be submitted without notes. Notes cannot be submitted without a file.

## Run it locally

```bash
npm install
cp .env.example .env.local   # add NVIDIA_API_KEY when you have one
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Without `NVIDIA_API_KEY` the same FILE 8 object is produced by a local
ruleset executor so the page still works.

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
`src/lib/data/credit-card-transaction.schema.json`:

- Extra keys are stripped.
- Missing fields are allowed.
- If nothing on the schema remains, the file is rejected.

`fixtures/lagos-impossible-travel.json` is a full high-risk sample (junk
fields at the bottom are stripped). `fixtures/sample-history.json` is a
partial history used to test sanitization.

## Red-team training

The red team generates schema-shaped synthetic fraud. Nemotron (or the local
executor) scores it. A feedback agent may append learnings only to RULES
files 3–7.

```bash
npm run dev
npm run train-ruleset
npm run train-ruleset -- --apply
```

`--apply` writes metadata + a learned-adjustment line into the mutable files.
CORE files are never written.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` static-exports Next.js with
`basePath` `/NemoScantron`. The static host has no API route, so the page
uses the local ruleset executor. Live Nemotron needs `NVIDIA_API_KEY` on a
Node host (`npm run dev` or Vercel).
