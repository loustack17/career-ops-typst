# Career-Ops -- AI Job Search Pipeline (Hermes Agent)

> This file is auto-loaded by Hermes Agent as persistent project context.
> It is the Hermes equivalent of CLAUDE.md. Slash command routing lives in `.hermes/skills/career-ops/SKILL.md`.
> **Do not invoke `.claude/skills/career-ops/SKILL.md`** — mirror its routing behavior instead.
> **Do not use `.opencode/commands/*` or `.gemini/commands/*` as executable routing.**
> `HERMES.md` is authoritative only for Hermes runtime routing and tool mapping. Shared Career-Ops behavior comes from `DATA_CONTRACT.md`, `modes/*`, scripts, and templates.

## CRITICAL RULES (read first)

1. **NEVER submit an application** without the user reviewing it first. Fill forms, draft answers, generate PDFs — but always STOP before Submit/Send/Apply.
2. **NEVER trust `web_extract` alone** to verify if an offer is still active. Use `browser_navigate` + `browser_snapshot`. Exception: batch mode, mark `**Verification:** unconfirmed (batch mode)`.
3. **NEVER edit `applications.md` to ADD entries** — use TSV in `batch/tracker-additions/` and `node merge-tracker.mjs`.
4. **NEVER create duplicate company+role entries** in applications.md. Update existing entries.
5. All reports MUST include `**URL:**` and `**Legitimacy:**` in the header.
6. All statuses MUST be canonical (see `templates/states.yml`).
7. After each evaluation batch, run `node merge-tracker.mjs`.
8. **Data Contract:** User customization goes in `modes/_profile.md` or `config/profile.yml`. NEVER put user-specific content in `modes/_shared.md`.

## Data Contract (CRITICAL)

Read `DATA_CONTRACT.md` for the full user/system file split. Hermes-specific rule: personalization belongs in `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, or `portals.yml`, never in shared mode defaults.

## Update Check

On session start, run silently: `node update-system.mjs check`

- `update-available` → tell the user, ask to apply
- `up-to-date` / `dismissed` / `offline` / `no-remote-version` → say nothing

To rollback: `node update-system.mjs rollback`

## Pipeline Integrity

Use TSV additions in `batch/tracker-additions/` plus `node merge-tracker.mjs`; never add tracker rows directly. Status values come from `templates/states.yml`. Use `node verify-pipeline.mjs`, `node normalize-statuses.mjs`, and `node dedup-tracker.mjs` for health, normalization, and tracker dedup.

## Origin

Built by [santifer](https://santifer.io) — 740+ offers evaluated, 100+ tailored CVs. Portfolio: [cv-santiago](https://github.com/santifer/cv-santiago). Designed to be customized — ask to change archetypes, scoring, or translation.

## What is career-ops

AI-powered job search automation: pipeline tracking, offer evaluation, CV generation, portal scanning, batch processing.

### Main Files

| File | Function |
|------|----------|
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Inbox of pending URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `portals.yml` | Query and company config |
| `cv.md` | Canonical CV (source of truth) |
| `article-digest.md` | Compact proof points (optional) |
| `interview-prep/story-bank.md` | Accumulated STAR+R stories |
| `scan.mjs` | Zero-token portal scanner (ATS APIs) |
| `check-liveness.mjs` | Job posting liveness checker |
| `generate-pdf.mjs` | Typst CV → PDF |
| `merge-tracker.mjs` | Merge tracker TSV into applications.md |
| `resolve-linkedin.mjs` | LinkedIn resolver (anti-bot bypass) |
| `resolve-indeed.mjs` | Indeed resolver |
| `verify-pipeline.mjs` | Pipeline health check |
| `normalize-statuses.mjs` | Status normalization |
| `dedup-tracker.mjs` | Dedup tracker entries |

### Hermes Commands

Use `/career-ops [subcommand]`. Canonical routing lives in `.hermes/skills/career-ops/SKILL.md`. Spanish aliases (`oferta`, `ofertas`, `contacto`) match Claude Code; English aliases are convenience only.

### Model Guidance

- **Frontier long-context models** for: scan, pipeline, batch, apply
- **Cheaper models** for: tracker, patterns, followup, simple comparisons

### Skill Modes

| User intent | Mode |
|-------------|------|
| Pastes JD or URL | auto-pipeline |
| Evaluate offer | oferta |
| Compare offers | ofertas |
| LinkedIn outreach | contacto |
| Company research | deep |
| Interview prep | interview-prep |
| Generate CV/PDF | pdf |
| Evaluate course/cert | training |
| Evaluate project | project |
| Application status | tracker |
| Fill application | apply |
| Search for offers | scan |
| Process URLs | pipeline |
| Batch process | batch |
| Rejection patterns | patterns |
| Follow-up cadence | followup |

### CV Source of Truth

`cv.md` is canonical. `article-digest.md` has detailed proof points. **NEVER hardcode metrics** — read from these files.

## Offer Verification -- MANDATORY

1. `browser_navigate` to the URL
2. `browser_snapshot` to read content
3. Only footer/navbar = closed. Title + description + Apply = active.

Batch fallback: use `web_extract`, mark report `**Verification:** unconfirmed (batch mode)`.

## Hermes Superpowers

Use Hermes Superpowers for planning, subagent work, debugging, TDD, and review when the task matches `docs/HERMES-SUPERPOWERS.md`. Superpowers are workflow discipline, not Career-Ops logic.

## First Run -- Onboarding

Check silently on every session start:

1. Does `cv.md` exist?
2. Does `config/profile.yml` exist (not just profile.example.yml)?
3. Does `modes/_profile.md` exist? If missing, copy from `modes/_profile.template.md` silently.
4. Does `portals.yml` exist?

If any is missing → onboarding mode. Guide the user through CV → Profile → Portals → Tracker setup. Store personalization in `modes/_profile.md` or `config/profile.yml`, never in `modes/_shared.md`.

After setup: "You're all set! Paste a job URL, run `/career-ops scan`, or `/career-ops` for all commands."

## Language Modes

Default: `modes/` (English). Locales available: `modes/de/` (German/DACH), `modes/fr/` (French), `modes/ja/` (Japanese), `modes/pt/` (Portuguese).

Check `config/profile.yml` for `language.modes_dir` to auto-select. Detect JD language and suggest switching if appropriate.

## Stack and Conventions

- Node.js (mjs), Typst (PDF), Playwright (scraping), YAML (config), Markdown (data)
- Scripts: `.mjs`, Config: YAML, Output: `output/` (gitignored), Reports: `reports/{YYYY-MM-DD}/{###}-{company-slug}-{YYYY-MM-DD}.md`

## Ethical Use -- CRITICAL

- Quality over quantity. Strongly discourage applications below 4.0/5.
- Respect recruiters' time. Only send what's worth reading.

## Sync Rule

When upstream `CLAUDE.md` changes behavior, compare against `HERMES.md`:
- Copy behavior changes unless Claude-tool-specific.
- Translate Claude-only capabilities to Hermes equivalents instead of dropping rules.
