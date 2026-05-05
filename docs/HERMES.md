# Hermes Setup -- Career-Ops

Career-Ops supports Hermes Agent through the project `HERMES.md` file and a skill in `.hermes/skills/career-ops/SKILL.md`.

## Prerequisites

- **Hermes Agent** installed (`hermes --version`)
- **Node.js 18+**
- **Playwright Chromium** for PDF generation and reliable job verification
- **Go 1.21+** (only if using the TUI dashboard)

## Install

```bash
cd /path/to/career-ops
npm install
npx playwright install chromium
```

## Enable the Skill

Option A -- symlink (recommended, survives repo updates):

```bash
mkdir -p ~/.hermes/skills
ln -s /path/to/career-ops/.hermes/skills/career-ops ~/.hermes/skills/career-ops
```

Option B -- copy:

```bash
mkdir -p ~/.hermes/skills
cp -r .hermes/skills/career-ops ~/.hermes/skills/career-ops
```

## Verify Hermes

```bash
hermes doctor
hermes tools
hermes skills
```

`hermes skills` should list `career-ops`.

## Verify Career-Ops

```bash
node doctor.mjs
git diff --check
GOCACHE=/tmp/career-ops-go-build-cache node test-all.mjs --quick
```

## First Use

Start Hermes in the career-ops repo directory:

```bash
cd /path/to/career-ops
hermes
```

Then type:

```
/career-ops
```

This shows the command menu. Or go directly to a subcommand:

```
/career-ops evaluate https://example.com/jobs/123
/career-ops scan
```

## Routing Map

| Command | Aliases | Mode | Files loaded |
|---------|---------|------|-------------|
| `/career-ops` | | discovery | `HERMES.md` |
| `/career-ops evaluate <url/JD>` | `oferta` | oferta | `modes/_shared.md`, `modes/oferta.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md` |
| `/career-ops scan` | | scan | `modes/_shared.md`, `modes/scan.md`, `modes/scan-hermes.md`, `portals.yml`, `config/profile.yml`, `modes/_profile.md`, `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md` |
| `/career-ops pipeline` | | pipeline | `modes/_shared.md`, `modes/pipeline.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md` |
| `/career-ops apply` | | apply | `modes/_shared.md`, `modes/apply.md` |
| `/career-ops pdf` | | pdf | `modes/_shared.md`, `modes/pdf.md`, `cv.md` |
| `/career-ops latex` | | latex | `modes/_shared.md`, `modes/latex.md`, `cv.md` |
| `/career-ops compare` | `ofertas` | ofertas | `modes/_shared.md`, `modes/ofertas.md` |
| `/career-ops contact` | `contacto` | contacto | `modes/_shared.md`, `modes/contacto.md` |
| `/career-ops deep` | | deep | `modes/deep.md` |
| `/career-ops tracker` | | tracker | `modes/tracker.md` |
| `/career-ops training` | | training | `modes/training.md` |
| `/career-ops project` | | project | `modes/project.md` |
| `/career-ops patterns` | | patterns | `modes/patterns.md` |
| `/career-ops followup` | | followup | `modes/followup.md` |
| `/career-ops batch` | | batch | `modes/_shared.md`, `modes/batch.md` |
| `/career-ops interview-prep` | | interview-prep | `modes/interview-prep.md` |
| `/career-ops update` | | update | `HERMES.md`, then `node update-system.mjs check` |
| Paste JD or URL | | auto-pipeline | `modes/_shared.md`, `modes/auto-pipeline.md`, `modes/oferta.md`, `modes/pdf.md`, `cv.md`, `config/profile.yml`, `modes/_profile.md` |

## Behavioral Rules

1. **Use `terminal` tool** for Node.js scripts (`scan.mjs`, `check-liveness.mjs`, `resolve-linkedin.mjs`, `resolve-indeed.mjs`, `merge-tracker.mjs`, `generate-pdf.mjs`, `verify-pipeline.mjs`, `normalize-statuses.mjs`, `dedup-tracker.mjs`).
2. **Use `browser_navigate` + `browser_snapshot`** for offer verification. Never trust `web_extract` alone.
3. **Use `web_search` + `web_extract`** for Level 3 scan discovery.
4. **Never submit an application** for the user.
5. **Never write tracker rows directly** into `data/applications.md`. Use TSV in `batch/tracker-additions/` plus `node merge-tracker.mjs`.
6. **After each batch**, run `node merge-tracker.mjs`.
7. **All reports** must include `**URL:**` and `**Legitimacy:**` in the header.
8. **All statuses** must be canonical (see `templates/states.yml`).
9. **After each batch of evaluations**, run `node merge-tracker.mjs`.

## Tool Mapping

| Task | Hermes tool | Fallback |
|------|-------------|----------|
| Run Node.js scripts | `terminal` | N/A |
| Verify offer is active | `browser_navigate` + `browser_snapshot` | `web_extract` (batch mode, mark unconfirmed) |
| Level 3 search discovery | `web_search` + `web_extract` | Direct browser navigation to search pages |
| LinkedIn resolver | `terminal`: `node resolve-linkedin.mjs` | N/A |
| Indeed resolver | `terminal`: `node resolve-indeed.mjs` | N/A |
| Subagent delegation | `delegate_task` | Run inline, report delegation unavailable |

## Scan Expectations

Hermes must run **all three scan levels**:

1. **Level 1**: Browser-driven company careers pages from `portals.yml`
2. **Level 2**: ATS/API scan via `node scan.mjs`
3. **Level 3**: Search discovery from `search_queries` in `portals.yml`

`node scan.mjs` alone is **not a complete scan**. It only covers Level 2.

The `modes/scan-hermes.md` runtime adapter ensures weaker models do not skip Level 1 or Level 3.

## Known Risks

- **Tool names** may differ by Hermes version. Verify with `hermes tools` after setup.
- **Search providers** may block automated queries. Use fallback paths documented in `modes/scan-hermes.md`.
- **LinkedIn and Indeed** require resolver scripts (`resolve-linkedin.mjs`, `resolve-indeed.mjs`). Do not attempt to scrape them directly.
- **Weaker models** may skip Level 1 or Level 3 unless `modes/scan-hermes.md` is loaded as part of the scan context.
- **Full Claude parity** depends on Hermes browser, search, terminal, and subagent capabilities being available.

## Claude-Parity Note

Hermes command names intentionally preserve Claude Code's Spanish mode names: `oferta`, `ofertas`, `contacto`. English aliases (`evaluate`, `compare`, `contact`) are convenience aliases only.

If behavior differs from Claude Code, prefer matching Claude Code behavior unless Hermes lacks the required capability.

## Update Flow

On the first message of each session, run the update checker silently:

```bash
node update-system.mjs check
```

See `HERMES.md` for the full update check behavior (what to report, what to silence).

## LinkedIn Helper

```bash
node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
```

## Indeed Helper

```bash
node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
```

## Verification

```bash
npm run verify
```

For the TUI dashboard (optional):

```bash
cd dashboard && go build ./...
```