---
name: career-ops-training
description: "Use $career-ops-training to evaluate a course or certification against the user's career goals (north-star alignment, recruiter signal, time/effort, opportunity cost). Triggers: 'should I take course X', 'evaluate this cert', 'is course Y worth it'."
---

# Career-Ops Training

Evaluate a course or certification on six dimensions: north-star alignment, recruiter signal, time and effort, opportunity cost, risks, portfolio deliverable.

## Files to Load

- `modes/training.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- Verdicts: DO (with weekly plan), DON'T DO (with alternative), DO WITH TIMEBOX (max X weeks).
- Tie advice to the user's target archetypes from `modes/_profile.md`/`config/profile.yml`.
- Surface opportunity cost concretely (what the user can't do during that time).

See `AGENTS.md` for safety rules.
