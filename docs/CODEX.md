# Codex Setup

Career-Ops supports Codex through the root `AGENTS.md` file.

If your Codex client reads project instructions automatically, `AGENTS.md`
is enough for routing and behavior. Codex should reuse the same checked-in
mode files, templates, tracker flow, and scripts that already power the
Claude workflow.

## Prerequisites

- A Codex client that can work with project `AGENTS.md`
- Node.js 18+
- Playwright Chromium installed for PDF generation and reliable job verification
- Go 1.21+ if you want the TUI dashboard

## Install

```bash
npm install
npx playwright install chromium
```

## Recommended Starting Prompts

- `Evaluate this job URL with Career-Ops and run the full pipeline.`
- `Scan my configured portals for new roles that match my profile.`
- `Generate the tailored ATS PDF for this role using Career-Ops.`

## Routing Map

| User intent | Files Codex should read |
|-------------|-------------------------|
| Raw JD text or job URL | `modes/_shared.md` + `modes/auto-pipeline.md` |
| Single evaluation only | `modes/_shared.md` + `modes/oferta.md` |
| Multiple offers | `modes/_shared.md` + `modes/ofertas.md` |
| Portal scan | `modes/_shared.md` + `modes/scan.md` |
| PDF generation | `modes/_shared.md` + `modes/pdf.md` |
| Live application help | `modes/_shared.md` + `modes/apply.md` |
| Pipeline inbox processing | `modes/_shared.md` + `modes/pipeline.md` |
| Tracker status | `modes/tracker.md` |
| Deep company research | `modes/deep.md` |
| Training / certification review | `modes/training.md` |
| Project evaluation | `modes/project.md` |

The key point: Codex support is additive. It should route into the existing
Career-Ops modes and scripts rather than introducing a parallel automation
layer.

## Behavioral Rules

- Treat raw JD text or a job URL as the full auto-pipeline path unless the user explicitly asks for evaluation only.
- Keep all personalization in `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, or `portals.yml`.
- Never verify a job’s live status with generic web fetch when Playwright is available.
- Never submit an application for the user.
- Never add new tracker rows directly to `data/applications.md`; use the TSV addition flow and `merge-tracker.mjs`.

## Verification

```bash
npm run verify

# optional dashboard build
cd dashboard && go build ./...
```

## LinkedIn Helper

Use the local resolver when a LinkedIn job page is visible but the normal scan flow cannot safely turn it into a pipeline item.

```bash
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/view/4383142038/' --json
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/search-results/?currentJobId=4383142038&keywords=DevOps%20Engineer' --add-to-pipeline
node resolve-linkedin.mjs 'https://www.linkedin.com/jobs/view/4383142038/' --keep-lead --title 'Platform Engineer - Toronto' --company 'Validus Risk Management'
```

The resolver:
- normalizes `search-results?currentJobId=...` and `jobs/view/...` URLs to a canonical `jobs/view/{id}` URL
- extracts public job details with Playwright
- writes a local JD into `jds/`
- optionally appends `local:jds/...` to `data/pipeline.md`
- can preserve a blocked or low-detail lead in `On Hold — Manual Verify` when `--keep-lead --title --company` are provided

This keeps the existing `pipeline` mode unchanged. After a successful resolve, run the normal `/career-ops pipeline` flow.

For automated scans, `modes/scan.md` now treats LinkedIn as a Level 3 discovery source only. If scan discovers a concrete LinkedIn job URL, it should call `resolve-linkedin.mjs --add-to-pipeline` automatically instead of adding the raw LinkedIn URL.

## Indeed Helper

Use the local resolver when an Indeed job URL is visible but the normal scan flow cannot safely normalize `jk` / `vjk` URLs.

```bash
node resolve-indeed.mjs 'https://ca.indeed.com/viewjob?jk=2058c3042916c01c' --json
node resolve-indeed.mjs 'https://ca.indeed.com/?vjk=2058c3042916c01c&advn=4357064039121098' --add-to-pipeline
node resolve-indeed.mjs 'https://ca.indeed.com/?vjk=2058c3042916c01c&advn=4357064039121098' --keep-lead --title 'DevOps Engineer' --company 'Example Co'
```

The resolver:
- normalizes `vjk` and `jk` URLs to a canonical `viewjob?jk=...` URL
- extracts public job details with Playwright when available
- detects Indeed / Cloudflare blocking explicitly
- writes a local JD into `jds/`
- optionally appends `local:jds/...` to `data/pipeline.md`
- can preserve a blocked lead in `On Hold — Manual Verify` when `--keep-lead --title --company` are provided

For automated scans, `modes/scan.md` now treats Indeed results the same way: if scan discovers a concrete Indeed job URL, it should call `resolve-indeed.mjs --add-to-pipeline` instead of adding the raw Indeed URL.
