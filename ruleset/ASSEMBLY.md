# Ruleset assembly

Eight files are concatenated in this order, then runtime data is appended.

| # | File | Class | Red team may edit? |
|---|------|-------|--------------------|
| 1 | `01_CORE_identity.txt` | CORE | Never |
| 2 | `02_CORE_execution_workflow.txt` | CORE | Never |
| 3 | `03_RULES_velocity_behavioral.txt` | RULES | Yes |
| 4 | `04_RULES_geo_device.txt` | RULES | Yes |
| 5 | `05_RULES_merchant_auth.txt` | RULES | Yes |
| 6 | `06_RULES_attack_patterns.txt` | RULES | Yes |
| 7 | `07_RULES_thresholds.txt` | RULES | Yes |
| 8 | `08_CORE_output_format.txt` | CORE | Never |
| 9 | User context note | Runtime | Optional |
| 10 | Transaction JSON | Runtime | **Required** |

A file may be submitted without notes. Notes may never be submitted without a file.

```
[who I am] → [how I reason] → [what to look for] → [thresholds]
→ [what to output] → [optional notes] → [transactions]
```

The assembler lives in `src/lib/ruleset/assemble.ts`. Nemotron sees only the assembled prompt. Training writes only files 3–7.
