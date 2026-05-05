# Codex Setup

Career-Ops supports Codex through `AGENTS.md` (auto-loaded project context) and a Codex skill router at `.agents/skills/career-ops/SKILL.md`.

## Prerequisites

- A Codex client that auto-loads project `AGENTS.md` and discovers local skills under `.agents/skills/`.
- Node.js 18+
- Playwright Chromium for PDF generation and reliable job verification
- Go 1.21+ if you want the TUI dashboard

## Install

```bash
npm install
npx playwright install chromium
```

## Primary Codex UX -- `$career-ops`

Codex has its own command center, equivalent to Claude Code's `/career-ops`. The skill router at `.agents/skills/career-ops/SKILL.md` owns argument parsing, subcommand routing, the discovery menu, and context loading per mode. It routes into the shared `modes/*` files used by Claude Code, OpenCode, Hermes, and Gemini CLI. Only the router and `modes/scan-codex.md` are Codex-specific.

For the full menu, alias list, and routing table, see `.agents/skills/career-ops/SKILL.md`.

## Codex Scan

`$career-ops scan` loads `modes/scan.md` (canonical strategy) and `modes/scan-codex.md` (Codex runtime adapter: tool mapping, subagent rules, Level 3 fallback chain). `node scan.mjs` alone is Level 2 only and is **not** a full scan. For the smoke / parity test, see `docs/CODEX-SCAN.md`.

LinkedIn and Indeed URLs go through the local resolvers, never through direct browser scraping (anti-bot will block).

## Behavior and Subagents

For never-submit, tracker writes, report headers, and personalization placement, see `AGENTS.md` "CRITICAL Rules". For scan subagent dispatch and parent-vs-sidecar ownership, see `modes/scan-codex.md`.

## Superpowers

Use Codex Superpowers skills when their descriptions match. Do not duplicate Superpowers mapping in Career-Ops Codex files -- a separate mapping creates drift.

## Recommended Starting Prompts

- `$career-ops` -- show the menu.
- `$career-ops oferta <job URL>` -- evaluate only.
- `$career-ops <full JD text>` -- run the full pipeline.
- `$career-ops scan` -- agentic portal scan.
- `$career-ops scan smoke test only, no writes` -- coverage check without modifying data files (see `docs/CODEX-SCAN.md`).

## Verification

```bash
node doctor.mjs
git diff --check
GOCACHE=/tmp/career-ops-go-build-cache node test-all.mjs --quick

# optional dashboard build
cd dashboard && go build ./...
```

Run `node update-system.mjs check` to silently check for upstream updates. The Codex skill router handles `$career-ops update` for explicit checks.

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
