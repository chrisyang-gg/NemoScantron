# NemoScantron

Credit-card / AP fraud watch powered by a Nemotron-shaped scorer. One page:
describe the activity or drop a `.json` history, then a **fraudometer** reads
the risk.

GitHub Pages builds on every push to `main`.

```
Composer (text + JSON) ──► validate ──► Nemotron score
                                 │
                                 ▼
                    fraudometer comes online
```

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## JSON shape

Any JSON is accepted. Nested objects are flattened into text the policy pack
can read. A typical history looks like `fixtures/sample-history.json`.

## Gauge bands

Green / amber / red cutoffs live in `src/lib/gauge.ts` (`GAUGE_BANDS`). They
are not exposed in the UI.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` static-exports Next.js with
`basePath` `/NemoScantron` and deploys to Pages. After the first green run,
the site is at `https://<user>.github.io/NemoScantron/`.

Developer trend training is still `npm run train-trends` against a local
`npm run dev` server.
