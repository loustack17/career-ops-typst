# Codex Setup

Career-Ops supports Codex through `AGENTS.md` (auto-loaded project context) and a set of focused skills under `.agents/skills/career-ops-*/`. There is no single mega router -- each workflow is its own `$career-ops-*` skill so Codex discovery, hints, and display names stay clean.

## Why Split Skills

Codex skills surface one entry per folder, and the description field drives discovery and trigger phrases. A single mega `$career-ops` router with subcommands works in Claude Code (slash command + subcommands) but produces awkward hints in Codex. Splitting gives each workflow its own description, its own trigger phrases, and its own minimal file-load list.

## Prerequisites

- A Codex client that auto-loads project `AGENTS.md` and discovers skills under `.agents/skills/`.
- Node.js 18+
- Playwright Chromium for PDF generation and reliable job verification
- Go 1.21+ if you want the TUI dashboard

## Install

```bash
npm install
npx playwright install chromium
```

## Skill Map

Tier 1 -- core job pipeline:

| Skill | Purpose |
|---|---|
| `$career-ops-scan` | Agentic portal scan (Levels 1/2/3) |
| `$career-ops-pipeline` | Process pending URLs in `data/pipeline.md` |
| `$career-ops-apply` | Live application assistant (never submits) |
| `$career-ops-evaluate` | Score one offer |
| `$career-ops-compare` | Rank multiple offers |
| `$career-ops-pdf` | ATS-optimized CV PDF via Typst |
| `$career-ops-tracker` | Application status overview |

Tier 2 -- supporting workflows:

| Skill | Purpose |
|---|---|
| `$career-ops-deep` | Deep-research prompt for a company |
| `$career-ops-batch` | Legacy batch processing of many JDs |
| `$career-ops-contact` | LinkedIn/outreach drafts |
| `$career-ops-followup` | Follow-up cadence and drafts |
| `$career-ops-interview-prep` | Company-specific interview intel |
| `$career-ops-patterns` | Rejection-pattern analysis |

Tier 3 -- advisory:

| Skill | Purpose |
|---|---|
| `$career-ops-training` | Evaluate a course/cert |
| `$career-ops-project` | Evaluate a portfolio project idea |
| `$career-ops-latex` | Export CV as LaTeX/Overleaf |
| `$career-ops-update` | Check for upstream system updates |

## Loading Rules

Each focused skill's `SKILL.md` is the source of truth for files to load. The shared `modes/*` files remain canonical -- skills do not duplicate scoring, scan, tracker, or PDF logic. `modes/scan-codex.md` is the only Codex-specific runtime adapter.

`career-ops-batch` currently wraps the existing Claude-worker batch architecture from `modes/batch.md`. For Codex-only runs, prefer `$career-ops-pipeline` unless the user explicitly wants the legacy batch flow and has the required worker runtime.

## Codex Scan

`$career-ops-scan` loads `modes/scan.md` (canonical strategy) and `modes/scan-codex.md` (Codex runtime adapter: tool mapping, subagent rules, Level 3 fallback chain). `node scan.mjs` alone is Level 2 only and is **not** a full scan. For the smoke / parity test, see `docs/CODEX-SCAN.md`.

LinkedIn and Indeed URLs go through the local resolvers, never through direct browser scraping (anti-bot will block).

## Behavior and Subagents

For never-submit, tracker writes, report headers, and personalization placement, see `AGENTS.md` "CRITICAL Rules". For scan subagent dispatch and parent-vs-sidecar ownership, see `modes/scan-codex.md`. Default for non-scan skills: run inline. Use subagents only when the user explicitly asks for them.

## Superpowers

Use Codex Superpowers skills when their descriptions match. Do not duplicate Superpowers mapping in Career-Ops Codex files -- a separate mapping creates drift.

## Recommended Starting Prompts

- `$career-ops-scan` -- agentic portal scan.
- `$career-ops-scan smoke test only, no writes` -- coverage check without modifying data files (see `docs/CODEX-SCAN.md`).
- `$career-ops-evaluate <job URL>` -- evaluate one offer.
- `$career-ops-pipeline` -- process pending URLs.
- `$career-ops-apply` -- application assistant for the role you are applying to.
- `$career-ops-tracker` -- show the tracker overview.

## Verification

```bash
node doctor.mjs
git diff --check
GOCACHE=/tmp/career-ops-go-build-cache node test-all.mjs --quick

# optional dashboard build
cd dashboard && go build ./...
```

Run `node update-system.mjs check` (or `$career-ops-update`) to check for upstream updates.

## LinkedIn / Indeed Helpers

Use local resolvers when LinkedIn or Indeed URLs are visible but the normal scan flow cannot safely turn them into pipeline items. For the complete script reference, see `docs/SCRIPTS.md`.

```bash
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/view/4383142038/' --json
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/search-results/?currentJobId=4383142038&keywords=DevOps%20Engineer' --add-to-pipeline
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/view/4383142038/' --keep-lead --title 'Platform Engineer - Toronto' --company 'Validus Risk Management'
node resolve-indeed.mjs 'https://ca.indeed.com/viewjob?jk=2058c3042916c01c' --json
node resolve-indeed.mjs 'https://ca.indeed.com/?vjk=2058c3042916c01c&advn=4357064039121098' --add-to-pipeline
node resolve-indeed.mjs 'https://ca.indeed.com/?vjk=2058c3042916c01c&advn=4357064039121098' --keep-lead --title 'DevOps Engineer' --company 'Example Co'
```

Resolvers normalize public URLs, write local JDs into `jds/`, optionally append `local:jds/...` to `data/pipeline.md`, and preserve blocked leads with `--keep-lead --title --company`. Automated scans must call the resolver instead of adding raw LinkedIn or Indeed URLs.
