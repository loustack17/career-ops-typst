---
name: career-ops-tracker
description: "Use $career-ops-tracker to view application status overview: counts by status, average score, PDF/report coverage. Triggers: 'show tracker', 'application status', 'how many applications'."
---

# Career-Ops Tracker

Display the application tracker (`data/applications.md`) and summary statistics.

## Files to Load

- `modes/tracker.md`
- `templates/states.yml`

Use shell filtering or targeted excerpts from `data/applications.md` for stats and row updates. Do not load the full tracker unless it is small.

## Rules

- Read-only by default. May update an existing row's status or notes when the user asks.
- Never add new rows here. Use `$career-ops-pipeline` or write TSV to `batch/tracker-additions/`.
- Statuses must be canonical (see `templates/states.yml`).
- Surface stats: total, by status, average score, % with PDF, % with report.

See `AGENTS.md` for safety rules.
