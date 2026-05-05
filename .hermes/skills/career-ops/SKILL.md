---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
version: 1.0.0
author: community
license: MIT
metadata:
  hermes:
    tags:
      - Job-Search
      - Career
      - AI-Pipeline
      - Automation
---

# Career-Ops -- Hermes Skill Router

This skill routes `/career-ops [subcommand]` to the appropriate mode files, matching the Claude Code skill behavior as closely as possible.

## Mode Routing

When invoked with `$ARGUMENTS`, route as follows:

| `$ARGUMENTS` | Mode | Files to load |
|---|---|---|
| *(empty)* | discovery | `HERMES.md` |
| URL or JD text | auto-pipeline | `modes/_shared.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md` |
| `oferta` or `evaluate` | oferta | `modes/_shared.md`, `modes/oferta.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md` |
| `scan` | scan | `modes/_shared.md`, `modes/scan.md`, `modes/scan-hermes.md`, `portals.yml`, `config/profile.yml`, `modes/_profile.md`; read `data/scan-history.tsv`, `data/pipeline.md`, and `data/applications.md` only for dedup after collecting candidates |
| `pipeline` | pipeline | `modes/_shared.md`, `modes/pipeline.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md` |
| `apply` | apply | `modes/_shared.md`, `modes/apply.md` |
| `pdf` | pdf | `modes/_shared.md`, `modes/pdf.md`, `cv.md` |
| `latex` | latex | `modes/_shared.md`, `modes/latex.md`, `cv.md` |
| `ofertas` or `compare` | ofertas | `modes/_shared.md`, `modes/ofertas.md` |
| `contacto` or `contact` | contacto | `modes/_shared.md`, `modes/contacto.md` |
| `deep` | deep | `modes/deep.md` |
| `tracker` | tracker | `modes/tracker.md` |
| `training` | training | `modes/training.md` |
| `project` | project | `modes/project.md` |
| `patterns` | patterns | `modes/patterns.md` |
| `followup` | followup | `modes/followup.md` |
| `batch` | batch | `modes/_shared.md`, `modes/batch.md` |
| `interview-prep` | interview-prep | `modes/interview-prep.md` |
| `update` | update | Load `HERMES.md`, then run `node update-system.mjs check` |

### Auto-pipeline detection

If `$ARGUMENTS` is not a known subcommand AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL, route to `auto-pipeline`.

If `$ARGUMENTS` is not a known subcommand AND doesn't look like a JD, show the discovery menu.

## Discovery Menu

When invoked with no arguments or unrecognized input that is not a JD, show a concise command menu generated from the routing table. Include the Claude-compatible aliases `oferta`, `ofertas`, and `contacto`, and state that pasted JD text or a job URL runs auto-pipeline.

## Context Loading by Mode

### Modes that require `_shared.md` + mode file

`auto-pipeline`, `oferta`, `ofertas`, `pdf`, `contacto`, `apply`, `pipeline`, `scan`, `batch`, `latex`

### Standalone modes (only their mode file)

`tracker`, `deep`, `training`, `project`, `patterns`, `followup`, `interview-prep`

### Additional files loaded by context

- `scan` also loads: `modes/scan-hermes.md`, `portals.yml`; read data files only when dedup is needed
- `oferta` and `auto-pipeline` also load: `cv.md`, `config/profile.yml`, `modes/_profile.md`
- `pdf` also loads: `cv.md`

## Subagent Delegation

When Hermes supports subagents (`delegate_task`), delegate as follows:

- **`scan`**: delegate source groups as described in `modes/scan-hermes.md`.
- **`apply`**: delegate to a subagent when browser interaction is required.
- **`pipeline`**: delegate to a subagent when there are 3 or more URLs in the inbox.

If Hermes subagents are unavailable, run the same mode inline and report that delegation was unavailable.

## Superpowers Integration

Use Hermes Superpowers when the task matches `docs/HERMES-SUPERPOWERS.md`.

## Multi-Agent Deployment

career-ops supports multiple agents (Claude Code, Codex, Hermes, OpenCode, Gemini CLI). Each agent has its own skill/command directory and invocation convention. See `references/multi-agent-deployment.md` for the full agent-location table, the `.codex/skills/` vs `.agents/skills/` pitfall, and architecture principles.

## Behavioral Rules

1. **Use browser tools** for offer verification. Never trust `web_extract` alone. Batch fallback: mark `**Verification:** unconfirmed (batch mode)`.
2. **Never submit an application** for the user.
3. **Never write tracker rows directly** into `data/applications.md`. Use TSV + `merge-tracker.mjs`.
4. All reports MUST include `**URL:**` and `**Legitimacy:**`.
5. All statuses MUST be canonical (see `templates/states.yml`).
6. After each batch, run `node merge-tracker.mjs`.
7. **NEVER create new entries** if company+role already exists.
8. Check `config/profile.yml` for `language.modes_dir`.

### LinkedIn & Indeed Resolvers

```bash
node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
```

Route concrete LinkedIn/Indeed URLs through resolvers. Do not scrape these platforms directly.
