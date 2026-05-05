---
name: career-ops-followup
description: "Use $career-ops-followup to compute follow-up cadence for sent applications and draft follow-up messages. Triggers: 'follow-up status', 'who should I follow up with', 'draft a follow-up'."
---

# Career-Ops Follow-up

Compute follow-up cadence from `data/applications.md` and `data/follow-ups.md`. Surface which applications are due, overdue, or stale, and draft follow-up messages on request.

## Files to Load

- `modes/followup.md`
- `config/profile.yml`
- `modes/_profile.md`

## Helpers

- Run `node followup-cadence.mjs` first for JSON cadence output.
- Load only the relevant `data/applications.md` or `data/follow-ups.md` excerpts needed to explain or update selected rows.

## Rules

- Draft follow-ups only. The user sends them.
- Respect cadence rules in `modes/followup.md`. Do not recommend follow-ups before the configured threshold.
- Update `data/follow-ups.md` only when the user confirms a follow-up was sent.

See `AGENTS.md` for safety rules.
