# NemoScantron

Credit-card / AP fraud watch powered by a Nemotron-shaped scorer. One page:
describe the activity or drop a `.json` history, then a **fraudometer** reads
the risk.

GitHub Pages builds on every push to `main`.

```
.json file ──► type check ──► schema scrub ──► Nemotron score
                                 │
                                 ▼
                    extra keys dropped; missing keys ok
```

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## JSON intake

Only `.json` files are accepted. Each record is projected onto
`src/lib/data/credit-card-transaction.schema.json` before it reaches the
scorer:

- Extra keys (and nested extras) are stripped.
- Missing fields are allowed. The schema `required` list is not enforced.
- If nothing on the schema remains after stripping, the file is rejected.
- A file may be one transaction, an array, or `{ "transactions": [...] }`.

`fixtures/sample-history.json` is a partial history plus junk fields that get
dropped on submit.

## Gauge bands

Green / amber / red cutoffs live in `src/lib/gauge.ts` (`GAUGE_BANDS`). They
are not exposed in the UI.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` static-exports Next.js with
`basePath` `/NemoScantron` and deploys to Pages. After the first green run,
the site is at `https://<user>.github.io/NemoScantron/`.

Developer trend training is still `npm run train-trends` against a local
`npm run dev` server.
