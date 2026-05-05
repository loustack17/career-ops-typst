---
name: career-ops-pipeline
description: "Use $career-ops-pipeline to process pending URLs from data/pipeline.md: evaluate, generate report + PDF, write tracker rows. Triggers: 'process pipeline', 'work the pipeline', 'process pending jobs'."
---

# Career-Ops Pipeline

Process pending URLs and JDs in `data/pipeline.md`. For each entry: verify liveness, evaluate, generate the report, generate the PDF, and write a TSV row to `batch/tracker-additions/`. The user runs `node merge-tracker.mjs` afterward.

## Files to Load

- `modes/_shared.md`
- `modes/pipeline.md`
- `modes/auto-pipeline.md`
- `modes/oferta.md`
- `modes/pdf.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` if present

## Rules

- Consume `data/pipeline.md`; do not rescan portals unless the user explicitly asks.
- Execute `modes/pipeline.md` plus `modes/auto-pipeline.md`. Safety, tracker, report, and status rules are in `AGENTS.md`.
- If only WebFetch/static extraction is available, mark verification as unconfirmed in the report header.

See `AGENTS.md` for safety rules.
