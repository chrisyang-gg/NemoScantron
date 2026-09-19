# NemoScantron

A website that scores **transaction history**. Upload a file or describe the
payments in text. The dashboard shows a **speedometer** of the risk score in
the middle of the page, then a written case for **why it is suspected as
fraud** — each policy hit, the wording that triggered it, and why that pattern
is treated as hostile.

Red-team work is **not on the website**. Developers introduce new suspicious
trends with an AI trainer:

```bash
npm run train-trends
npm run train-trends -- --apply --brief "micro-deposits then a large pull"
```

That writes into the same ruleset the public page uses.

```
Website: file or text history ──► sanitize ──► policy ──► Nemotron
                                                         │
                                                         ▼
                                          risk score + rationale on /

Developers: npm run train-trends ──► AI red team ──► feedback ──► new rules
```

The site is a single page: [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Run it

```bash
npm install
cp .env.example .env.local   # optional: NVIDIA_API_KEY
npm run dev
```

## Who owns what

[TEAM.md](./TEAM.md)
