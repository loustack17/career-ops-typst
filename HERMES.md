# Career-Ops — AI Job Search Pipeline (Hermes Agent)

> This file is auto-loaded by the Hermes Agent as persistent context.
> The skill router is at `.hermes/skills/career-ops/SKILL.md` (symlink → `.agents/skills/career-ops/SKILL.md`).
> All behavior — subcommand routing, context loading, discovery menu — lives in the unified SKILL.md. Changes to the skill apply to all agents.

## What is career-ops

AI-powered job search automation: pipeline tracking, offer evaluation, CV generation, portal scanning, batch processing. Built on Claude Code, now supported on any agent that follows the open agent skill standard (Claude Code, Codex, Hermes, Gemini, OpenCode, Qwen).

## Data Contract (CRITICAL)

**User Layer (NEVER auto-updated — your personalizations live here):**
- `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `portals.yml`
- `data/*`, `reports/*`, `output/*`, `interview-prep/*`

**System Layer (auto-updatable — do NOT put user data here):**
- `modes/_shared.md`, `modes/oferta.md`, all other modes
- `HERMES.md`, `CLAUDE.md`, `AGENTS.md`, `*.mjs` scripts, `templates/*`, `batch/*`

**THE RULE:** When the user asks to customize anything — write to `modes/_profile.md` or `config/profile.yml`. NEVER edit `modes/_shared.md` for user-specific content.

## Update Check

On the first message of each session, run the update checker silently:

```bash
node update-system.mjs check
```

- `update-available` → tell the user, ask to apply
- `up-to-date` or `dismissed` or `offline` → say nothing

## Hermes-Specific Notes

The unified SKILL.md routes `/career-ops` commands. Hermes invokes skills via `$ARGUMENTS` — the router determines the mode from the text after the command.

For subagents, use `delegate_task` (Hermes native). When unavailable, run inline.

## First Run — Onboarding

Check silently every session:

1. Does `cv.md` exist?
2. Does `config/profile.yml` exist (not just profile.example.yml)?
3. Does `modes/_profile.md` exist? If missing, copy from `modes/_profile.template.md` silently.
4. Does `portals.yml` exist?

If any is missing → onboarding mode. Guide the user through setup. Personalize into `modes/_profile.md` or `config/profile.yml`.

## Ethical Use — CRITICAL

- **NEVER submit an application** for the user. Fill forms, draft answers, generate PDFs — STOP before clicking Submit.
- **Quality over speed.** Strongly discourage applications below 4.0/5.
- **Respect recruiters' time.** Only send what's worth reading.

## Pipeline Integrity

1. **NEVER edit applications.md to ADD new entries** — use TSV in `batch/tracker-additions/` + `node merge-tracker.mjs`.
2. Run `node verify-pipeline.mjs` for health checks.
3. All reports MUST include `**URL:**` and `**Legitimacy:**`.
4. All statuses MUST be canonical (see `templates/states.yml`).
5. After each batch of evaluations, run `node merge-tracker.mjs`.
6. Use `browser_navigate` + `browser_snapshot` for offer verification. Never trust `web_extract` alone. Batch fallback: mark `**Verification:** unconfirmed (batch mode)`.
