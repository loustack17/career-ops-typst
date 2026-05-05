---
name: career-ops-interview-prep
description: "Use $career-ops-interview-prep to build company-specific interview intel: STAR+R stories, likely questions, technical deep-dives, salary research. Triggers: 'interview prep for X', 'help me prep for an interview', 'questions to expect at company Y'."
---

# Career-Ops Interview Prep

Generate a company-specific interview intelligence report at `interview-prep/{company}-{role}.md`. Pulls stories from `interview-prep/story-bank.md` when present.

## Files to Load

- `modes/interview-prep.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` if present
- `interview-prep/story-bank.md` if present
- The matching report under `reports/` if it exists

## Rules

- Reuse STAR+R stories from `interview-prep/story-bank.md`. Append new stories there when the user shares them.
- Output goes to `interview-prep/{company}-{role}.md`.
- Sections: company context, likely questions, STAR+R stories mapped to questions, technical deep-dive prep, comp/leveling notes, red flags to ask about.
- Do not invent stories or metrics. Anchor everything in `cv.md` and `article-digest.md`.

See `AGENTS.md` for safety rules.
