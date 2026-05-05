---
name: career-ops-project
description: "Use $career-ops-project to evaluate a portfolio project idea against signal-for-target-roles, uniqueness, demo-ability, metrics, time-to-MVP, and STAR story potential. Triggers: 'evaluate this project idea', 'should I build X', 'portfolio project review'."
---

# Career-Ops Project

Score a portfolio project idea on six dimensions and produce a verdict (BUILD / SKIP / PIVOT TO).

## Files to Load

- `modes/project.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- For BUILD verdicts, output the 80/20 plan: Week 1 MVP with core metric, Week 2 polish + interview pack.
- Required interview-pack outputs: one-pager (product + architecture + metrics), demo (live URL or 2-min recording), postmortem.
- For SKIP, justify with what to do instead.
- Tie the verdict to the user's target archetypes.

See `AGENTS.md` for safety rules.
