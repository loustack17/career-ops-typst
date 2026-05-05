---
name: career-ops-compare
description: "Use $career-ops-compare to compare and rank multiple job offers side-by-side using the same rubric. Triggers: 'compare these offers', 'rank these jobs', 'which offer is better'."
---

# Career-Ops Compare

Compare and rank multiple offers side by side using the comparison rubric in `modes/ofertas.md`.

## Files to Load

- `modes/_shared.md`
- `modes/ofertas.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- Score each offer against the same rubric and present results as a ranked table with deltas.
- Surface trade-offs explicitly (comp vs. growth, role fit vs. company stage, etc.).
- Do not write tracker rows from this skill. Use `$career-ops-pipeline` or `$career-ops-evaluate` for that.

See `AGENTS.md` for safety rules.
