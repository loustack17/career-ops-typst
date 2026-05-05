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
| `scan` | scan | `modes/_shared.md`, `modes/scan.md`, `modes/scan-hermes.md`, `portals.yml`, `config/profile.yml`, `modes/_profile.md`, `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md` |
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

When invoked with no arguments or unrecognized input (that isn't a JD), show:

```
Career-Ops -- AI Job Search Pipeline

Commands:
  /career-ops evaluate <url/JD>   Evaluate job offer (A-G scoring)
  /career-ops compare             Compare and rank multiple offers
  /career-ops contact             LinkedIn outreach (find contacts + draft)
  /career-ops deep                Deep company research
  /career-ops pdf <url/JD>        Generate ATS-optimized CV
  /career-ops latex <url/JD>      Export CV as LaTeX/Overleaf .tex
  /career-ops training            Evaluate course/cert against goals
  /career-ops project             Evaluate portfolio project idea
  /career-ops tracker             Application status overview
  /career-ops apply               Live application assistant
  /career-ops scan                Scan portals for new offers
  /career-ops pipeline            Process pending URLs from inbox
  /career-ops batch               Batch processing with parallel workers
  /career-ops patterns            Analyze rejection patterns
  /career-ops followup            Follow-up cadence tracker
  /career-ops interview-prep      Company-specific interview intelligence
  /career-ops update              Check for career-ops updates

Aliases: oferta=evaluate, ofertas=compare, contacto=contact

Paste a job URL or description to auto-pipeline (evaluate + report + PDF + tracker).
```

## Context Loading by Mode

### Modes that require `_shared.md` + mode file

`auto-pipeline`, `oferta`, `ofertas`, `pdf`, `contacto`, `apply`, `pipeline`, `scan`, `batch`, `latex`

### Standalone modes (only their mode file)

`tracker`, `deep`, `training`, `project`, `patterns`, `followup`, `interview-prep`

### Additional files loaded by context

- `scan` also loads: `modes/scan-hermes.md`, `portals.yml`, `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md`
- `oferta` and `auto-pipeline` also load: `cv.md`, `config/profile.yml`, `modes/_profile.md`
- `pdf` also loads: `cv.md`

## Subagent Delegation

When Hermes supports subagents (`delegate_task`), delegate as follows:

- **`scan`**: delegate entire scan to a subagent with the scan mode files loaded.
- **`apply`**: delegate to a subagent when browser interaction is required.
- **`pipeline`**: delegate to a subagent when there are 3 or more URLs in the inbox.

If Hermes subagents are unavailable, run the same mode inline and report that delegation was unavailable.

## Superpowers Integration

Use Hermes Superpowers skills when the task matches:

| Hermes skill | Use in Career-Ops |
|---|---|
| `writing-plans` | Use before multi-file adapter changes, migration plans, and risky scan changes. |
| `subagent-driven-development` | Use for scan source splitting, batch processing, resolver verification, and independent implementation work. |
| `systematic-debugging` | Use for blocked portals, search failures, liveness false positives, resolver failures, PDF/layout regressions, and tracker merge issues. |
| `test-driven-development` | Use for resolver scripts, liveness logic, parser changes, and reusable automation code. |
| `requesting-code-review` | Use before finalizing Hermes adapter changes or any change affecting scan/pipeline/apply behavior. |

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