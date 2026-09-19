# Red-team rounds

`npm run red-team -- --count N` writes each generated case here:

```
rounds/round-001/manifest.json
rounds/round-001/case-01.json
rounds/round-001/round.json
```

`rounds/` is gitignored. Gold labels live on these files for Claude. The
scoring Nemotron never receives `label` or the gold decision.
