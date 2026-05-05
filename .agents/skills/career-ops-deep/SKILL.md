---
name: career-ops-deep
description: "Use $career-ops-deep to generate a structured deep-research prompt for a target company and role (AI strategy, recent moves, leadership, signals, risks). Triggers: 'deep research on X', 'company research', 'tell me about company Y'."
---

# Career-Ops Deep Research

Generate a structured deep-research prompt the user can paste into Perplexity/Claude/ChatGPT. Six axes: AI strategy, recent moves, leadership, customer signals, risks, interview leverage.

## Files to Load

- `modes/deep.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- This skill outputs a prompt, not a full research report. The user runs the prompt elsewhere.
- Tailor the prompt to the target role context if known.
- Do not fabricate facts. The output is a research scaffold, not findings.

See `AGENTS.md` for safety rules.
