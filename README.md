# NemoScantron

A website that scores **transaction history**. Upload a file or describe the
payments in text. The page returns a **risk score** and a written account of
**how that score was drawn**.

Red-team work is **not on the website**. Developers introduce new suspicious
trends with an AI trainer:

```bash
npm run train-trends
npm run train-trends -- --apply --brief "micro-deposits then a large pull"
```

That writes into the same ruleset the public scan page uses.

```
Website: file or text history ──► sanitize ──► policy ──► Nemotron
                                                         │
                                                         ▼
                                          risk score + rationale on /scan

Developers: npm run train-trends ──► AI red team ──► feedback ──► new rules
```

## Pages

| Path | What it is |
| --- | --- |
| `/` | Homepage |
| `/scan` | File or text intake, risk score, reasoning |
| `/how-it-works` | Pipeline and team split |

There is no lab page.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: NVIDIA_API_KEY
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Who owns what

[TEAM.md](./TEAM.md)
