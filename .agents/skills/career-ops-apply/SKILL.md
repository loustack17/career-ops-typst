---
name: career-ops-apply
description: "Use $career-ops-apply as a live application assistant: draft answers to form fields, custom questions, cover letter snippets. Never submits. Triggers: 'help me apply', 'application assistant', 'fill out application'."
---

# Career-Ops Apply

Live application assistant. Helps the user fill in application forms, custom questions, and cover-letter prompts with copy-paste-ready answers.

## Files to Load

- `modes/_shared.md`
- `modes/apply.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` if present

## Rules

- **Never submit.** Always stop before Submit / Send / Apply. The user makes the final click.
- Ask for visible form questions, screenshots, or paste of the form when needed.
- Return copy-paste answers, not autonomous form fills.
- Keep answers grounded in `cv.md` and `article-digest.md`. Do not invent metrics.
- If the score for the role is below 4.0/5, recommend against applying unless the user has a specific reason.

See `AGENTS.md` for safety rules.
