---
name: career-ops-evaluate
description: "Use $career-ops-evaluate to score a single job offer (URL or JD text) using the A-G rubric and produce a report. Triggers: 'evaluate this job', 'score this offer', 'rate this role'."
---

# Career-Ops Evaluate

Evaluate one URL or one JD. Score Blocks A-F plus G (Posting Legitimacy) per `modes/oferta.md`. Produce a report under `reports/{NNN}-{slug}-{YYYY-MM-DD}.md`.

## Files to Load

- `modes/_shared.md`
- `modes/oferta.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` if present

## Rules

- Verify liveness with browser tooling before scoring. If only WebFetch/static extraction is available, mark verification as unconfirmed in the report header.
- Report header must include `**URL:**` and `**Legitimacy:** {tier}`.
- Do not generate the PDF or write tracker rows unless the user asks for the full pipeline (use `$career-ops-pipeline` or `$career-ops-pdf`).
- Numbering is sequential 3-digit zero-padded; max existing + 1.
- Never hardcode metrics. Read them from `cv.md` and `article-digest.md` at evaluation time.
- Scores below 4.0/5 should explicitly recommend against applying.

See `AGENTS.md` for safety rules.
