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

## Behavioral Rules

1. **Use `terminal` tool** for Node.js scripts:
   - `node scan.mjs`
   - `node check-liveness.mjs`
   - `node resolve-linkedin.mjs`
   - `node resolve-indeed.mjs`
   - `node merge-tracker.mjs`
   - `node generate-pdf.mjs`
   - `node verify-pipeline.mjs`
   - `node normalize-statuses.mjs`
   - `node dedup-tracker.mjs`

2. **Use `browser_navigate` + `browser_snapshot`** for offer verification. Never trust `web_extract` alone for active/intact determination. Use `web_extract` as fallback only in batch mode and mark the report as `**Verification:** unconfirmed (batch mode)`.

3. **Use `web_search` + `web_extract`** for Level 3 scan discovery.

4. **Never submit an application** for the user. Fill forms, draft answers, generate PDFs -- but always STOP before clicking Submit/Send/Apply.

5. **Never write tracker rows directly** into `data/applications.md`. Use TSV additions in `batch/tracker-additions/` plus `node merge-tracker.mjs`.

6. **After each batch of evaluations**, run `node merge-tracker.mjs`.

7. **NEVER create new entries** in `applications.md` if company+role already exists. Update the existing entry.

8. All reports MUST include `**URL:**` and `**Legitimacy:**` in the header.

9. All statuses MUST be canonical (see `templates/states.yml`).

10. **Check `config/profile.yml`** for `language.modes_dir` to select locale modes directory (e.g., `modes/de`, `modes/fr`, `modes/ja`, `modes/pt`).

### LinkedIn & Indeed Resolvers

```bash
node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
```

Route concrete LinkedIn URLs through the LinkedIn resolver. Route concrete Indeed URLs through the Indeed resolver. Do not attempt to scrape these platforms directly -- their anti-bot measures will block browser tools.
