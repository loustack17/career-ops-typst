# Career-Ops for Codex

This file is auto-loaded by Codex as persistent project context. It is the Codex equivalent of `CLAUDE.md`. It is intentionally short -- shared behavior lives in `modes/*`, scripts, and templates.

## Primary Entrypoint -- `$career-ops`

The Codex command center is the `$career-ops` skill at `.agents/skills/career-ops/SKILL.md`. It owns subcommand routing and context loading.

For the full routing table, scan expectations, subagent guidance, and verification commands, see `docs/CODEX.md`.

## CRITICAL Rules

1. **Never submit an application** for the user. Fill forms, draft answers, generate PDFs -- always STOP before Submit / Send / Apply.
2. **Never trust generic web fetch alone** to verify offer liveness. Use Codex browser tooling (`browser_navigate` + `browser_snapshot`) when available. Batch mode fallback: WebFetch with `**Verification:** unconfirmed (batch mode)` in the report header.
3. **Never edit `data/applications.md` to ADD new entries.** Write TSV in `batch/tracker-additions/{num}-{slug}.tsv`, then run `node merge-tracker.mjs`.
4. **Never create duplicate company+role entries.** Update existing rows in place.
5. All reports MUST include `**URL:**` and `**Legitimacy:**` in the header.
6. All statuses MUST be canonical -- see `templates/states.yml`.
7. **Personalization belongs in user-layer files** (`modes/_profile.md`, `config/profile.yml`, `article-digest.md`, `portals.yml`). Never write user-specific content to `modes/_shared.md` or any other system-layer file.

## Data Contract

Read `DATA_CONTRACT.md` for the full user/system file split. Codex must reuse the existing modes, scripts, templates, and tracker flow rather than introducing parallel logic.

## Scan Runtime Adapter

`$career-ops scan` loads `modes/scan.md` (canonical strategy) plus `modes/scan-codex.md` (Codex runtime mapping for browser tooling, subagents, and Level 3 fallbacks). `node scan.mjs` alone is **not** a full scan -- it is Level 2 only. For the smoke test and parity criteria, see `docs/CODEX-SCAN.md`.

## Update Check

On the first `$career-ops` invocation, or when the user asks for updates, run silently: `node update-system.mjs check`. Act only on `update-available`. Other statuses (`up-to-date`, `dismissed`, `offline`, `no-remote-version`) are silent.

## Codex-Specific Setup

For prerequisites, install steps, recommended starting prompts, and the LinkedIn / Indeed helper scripts, see `docs/CODEX.md`.

## Superpowers

Use Codex Superpowers skills directly when their descriptions match. Do not duplicate Superpowers mapping in Career-Ops Codex files.
