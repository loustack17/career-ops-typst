---
name: career-ops-patterns
description: "Use $career-ops-patterns to analyze rejection patterns across the tracker and recommend targeting changes. Triggers: 'analyze rejections', 'why am I getting rejected', 'pattern analysis', 'improve my targeting'."
---

# Career-Ops Patterns

Analyze rejection and discard patterns across `data/applications.md` and report-level signals. Recommend targeting, scoring, and CV-narrative changes.

## Files to Load

- `modes/patterns.md`
- `config/profile.yml`
- `modes/_profile.md`

## Helpers

- Run `node analyze-patterns.mjs` first for JSON pattern output.
- Load only the relevant `data/applications.md` excerpts needed to explain a pattern or support a specific recommendation.

## Rules

- Group by company stage, role family, comp band, geography, and score range.
- Surface concrete changes the user can make (archetype tweak, CV tweak, portal filter tweak). Avoid vague advice.
- Do not edit `data/applications.md` rows from this skill.

See `AGENTS.md` for safety rules.
