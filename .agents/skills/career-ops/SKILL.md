---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
---

# Career-Ops -- Codex Skill Router

This skill is the Codex equivalent of Claude Code's `/career-ops` command center. It triggers on `$career-ops` and routes subcommands to the shared `modes/*` files.

## Trigger and Argument Parsing

Trigger: `$career-ops [subcommand] [extra args...]`

1. Tokenize the text after `$career-ops`. Trim whitespace. The first token is the subcommand.
2. If there is no token, route to the discovery menu.
3. If the input does not match any known subcommand but contains URL text (`http://`, `https://`) or JD signal words (`responsibilities`, `requirements`, `qualifications`, `about the role`, `we're looking for`), route to `auto-pipeline` and treat the entire argument as the JD or URL.
4. Otherwise, look up the subcommand in the routing table below.

Aliases mirror Claude Code:
- Spanish canonical: `oferta`, `ofertas`, `contacto`
- English aliases: `evaluate` -> `oferta`, `compare` -> `ofertas`, `contact` -> `contacto`

## Routing Table

| Input after `$career-ops` | Mode | Files to load |
|---|---|---|
| *(empty)* | discovery | `AGENTS.md`, `docs/CODEX.md` |
| URL or JD text | auto-pipeline | `modes/_shared.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md`; `article-digest.md` if present |
| `oferta` or `evaluate` | oferta | `modes/_shared.md`, `modes/oferta.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md` |
| `ofertas` or `compare` | ofertas | `modes/_shared.md`, `modes/ofertas.md` |
| `contacto` or `contact` | contacto | `modes/_shared.md`, `modes/contacto.md` |
| `scan` | scan | `modes/_shared.md`, `modes/scan.md`, `modes/scan-codex.md`, `portals.yml`, `config/profile.yml`, `modes/_profile.md`; read `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md` only after collecting candidates, for dedup |
| `pipeline` | pipeline | `modes/_shared.md`, `modes/pipeline.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md` |
| `apply` | apply | `modes/_shared.md`, `modes/apply.md` |
| `pdf` | pdf | `modes/_shared.md`, `modes/pdf.md`, `cv.md` |
| `latex` | latex | `modes/_shared.md`, `modes/latex.md`, `cv.md` |
| `deep` | deep | `modes/deep.md` |
| `tracker` | tracker | `modes/tracker.md` |
| `training` | training | `modes/training.md` |
| `project` | project | `modes/project.md` |
| `patterns` | patterns | `modes/patterns.md` |
| `followup` | followup | `modes/followup.md` |
| `batch` | batch | `modes/_shared.md`, `modes/batch.md` |
| `interview-prep` | interview-prep | `modes/interview-prep.md` |
| `update` | update | Run `node update-system.mjs check`; act on JSON status |

Do not duplicate scoring, tracker, PDF, or scan logic in this file. The routed mode files own that behavior. `modes/scan-codex.md` is the only Codex-specific runtime adapter; it does not redesign scan.

## Discovery Menu

When invoked with no arguments, print:

```text
career-ops -- Codex Command Center

Usage:
  $career-ops                       Show this menu
  $career-ops {URL or JD}           AUTO-PIPELINE: evaluate + report + PDF + tracker
  $career-ops oferta {URL or JD}    Evaluate only (alias: evaluate)
  $career-ops ofertas               Compare and rank multiple offers (alias: compare)
  $career-ops contacto              LinkedIn outreach draft (alias: contact)
  $career-ops scan                  Agentic portal scan (Levels 1/2/3)
  $career-ops pipeline              Process pending URLs from data/pipeline.md
  $career-ops apply                 Live application assistant
  $career-ops pdf                   Generate ATS-optimized CV PDF
  $career-ops latex                 Export CV as LaTeX/Overleaf
  $career-ops deep                  Deep company research
  $career-ops tracker               Application status overview
  $career-ops training              Evaluate course/cert ROI
  $career-ops project               Evaluate portfolio project idea
  $career-ops patterns              Analyze rejection patterns
  $career-ops followup              Follow-up cadence tracker
  $career-ops batch                 Batch processing
  $career-ops interview-prep        Company-specific interview intel
  $career-ops update                Check for upstream system updates

Tip: Pasting a job URL or full JD runs the full pipeline.
```

Keep the printed menu short. Do not append per-mode descriptions beyond the lines above.

## Context Loading

Use the routing table above as the source of truth. If `config/profile.yml` defines `language.modes_dir`, load the locale equivalent instead of the default `modes/` file.

## Codex Subagent Guidance

Use Codex subagents only for bounded sidecar tasks. Do not delegate the main flow, user interaction, or broad writes to shared data files. See `modes/scan-codex.md` for scan-specific ownership and dispatch rules.

## Superpowers

If Codex Superpowers skills are available in the session, use them directly when their descriptions match (planning, brainstorming, debugging, TDD, verification-before-completion, etc.). Do not duplicate Superpowers mapping in Career-Ops files.

## Behavioral Rules

See `AGENTS.md` "CRITICAL Rules" -- it is auto-loaded as Codex project context and is canonical for never-submit, tracker writes, report headers, canonical statuses, and personalization placement.

## Local Helpers

For scan, evaluation, and tracker scripts (`scan.mjs`, `resolve-linkedin.mjs`, `resolve-indeed.mjs`, `merge-tracker.mjs`, `generate-pdf.mjs`, `check-liveness.mjs`, `verify-pipeline.mjs`, `normalize-statuses.mjs`, `dedup-tracker.mjs`, `update-system.mjs`), see `docs/CODEX.md` and `docs/SCRIPTS.md`.

Route concrete LinkedIn URLs through `resolve-linkedin.mjs` and Indeed URLs through `resolve-indeed.mjs`. Do not scrape these platforms directly -- anti-bot will block the session.
