---
name: career-ops-scan
description: "Use $career-ops-scan to scan configured job sources for new matching roles. Runs Career-Ops Levels 1/2/3 (browser, ATS APIs, search). Triggers: 'scan jobs', 'find new roles', 'check portals', 'scan for jobs'."
---

# Career-Ops Scan

Run an agentic portal scan against `tracked_companies` and `search_queries` from `portals.yml`. Canonical strategy lives in `modes/scan.md`; the Codex runtime adapter lives in `modes/scan-codex.md`.

## Files to Load

- `modes/_shared.md`
- `modes/scan.md`
- `modes/scan-codex.md`
- `portals.yml`
- `config/profile.yml`
- `modes/_profile.md`

Read `data/scan-history.tsv`, `data/pipeline.md`, and `data/applications.md` only after collecting candidate URLs, for dedup. Use `rg`/`grep` to filter; do not load the full files into context.

## Rules

Follow `modes/scan.md` plus `modes/scan-codex.md`. `docs/CODEX-SCAN.md` defines smoke-test constraints. Use subagent sidecars by default when available, because `$career-ops-scan` is an agentic workflow and must preserve Claude Code scan parity. The parent agent owns dedup, liveness, and writes. If subagents are unavailable, run inline and report `Subagents used: no`.

See `AGENTS.md` for safety rules.
