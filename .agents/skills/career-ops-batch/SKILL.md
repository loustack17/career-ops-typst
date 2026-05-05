---
name: career-ops-batch
description: "Use $career-ops-batch for the legacy Career-Ops batch flow for many JDs/URLs. Requires the worker runtime documented in modes/batch.md; for Codex-only processing, prefer $career-ops-pipeline. Triggers: 'batch process these jobs', 'batch evaluate', 'run batch'."
---

# Career-Ops Batch

Batch-process many offers in parallel using the existing `batch/` worker architecture. Each worker evaluates one JD, writes a report, generates a PDF, and writes one TSV row to `batch/tracker-additions/`. The user runs `node merge-tracker.mjs` afterward.

## Files to Load

- `modes/_shared.md`
- `modes/batch.md`
- `batch/batch-prompt.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- This is a legacy batch workflow documented in `modes/batch.md`. It may require Claude CLI workers. For Codex-only processing, use `$career-ops-pipeline`.
- Batch workers cannot use Playwright. Mark report headers as `**Verification:** unconfirmed (batch mode)`.
- Workers must write TSV in `batch/tracker-additions/{num}-{slug}.tsv`. Never edit `data/applications.md` directly.
- After the batch completes, the user (or this skill, if invoked) runs `node merge-tracker.mjs`.
- Reports must include `**URL:**` and `**Legitimacy:**` headers.
- Statuses canonical per `templates/states.yml`.

See `AGENTS.md` for safety rules.
