# OpenCode Runtime

Career-Ops supports OpenCode by loading the same checked-in mode files, scripts, templates, and tracker flow used by the rest of the project.

OpenCode support is a runtime layer. It does not fork evaluation, pipeline, PDF, or tracker logic.

`opencode.json` loads this file as OpenCode-specific project context. `AGENTS.md` remains shared with Codex and other tools.

## Recommended Models

Use a frontier long-context model with reliable tool use. Strongly prefer GPT-5.x-class, DeepSeek V4 Pro-class, Kimi K2.6-class, or an equivalent agent model for scan and pipeline work.

Use high reasoning for `scan`, `pipeline`, `apply`, and `batch`. Cheaper or lower-effort models are fine for `tracker`, `patterns`, simple comparisons, and follow-up drafts.

## Shared Files

| Area | Shared files |
|------|--------------|
| Routing logic | `.opencode/commands/*.md` |
| Modes | `modes/*.md` |
| User profile | `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md` |
| Sources | `portals.yml` |
| Pipeline state | `data/pipeline.md`, `data/scan-history.tsv`, `data/applications.md` |
| Reports | `reports/` |
| PDF | `modes/pdf.md`, `generate-pdf.mjs`, `templates/cv.typ`, `templates/cv/*` |
| LaTeX | `modes/latex.md`, `generate-latex.mjs`, `templates/cv-template.tex` |
| Batch | `modes/batch.md`, `batch/batch-prompt.md`, `batch/tracker-additions/` |
| Follow-up | `modes/followup.md`, `followup-cadence.mjs`, `data/follow-ups.md` |
| Patterns | `modes/patterns.md`, `analyze-patterns.mjs` |
| Resolvers | `resolve-linkedin.mjs`, `resolve-indeed.mjs`, `check-liveness.mjs` |

## Commands

| Command | Mode |
|---------|------|
| `/career-ops` | Router or auto-pipeline |
| `/career-ops-scan` | `modes/scan.md` + `modes/scan-opencode.md` |
| `/career-ops-pipeline` | `modes/pipeline.md` |
| `/career-ops-evaluate` | `modes/oferta.md` |
| `/career-ops-compare` | `modes/ofertas.md` |
| `/career-ops-pdf` | `modes/pdf.md` |
| `/career-ops-latex` | `modes/latex.md` |
| `/career-ops-apply` | `modes/apply.md` |
| `/career-ops-contact` | `modes/contacto.md` |
| `/career-ops-deep` | `modes/deep.md` |
| `/career-ops-batch` | `modes/batch.md` |
| `/career-ops-tracker` | `modes/tracker.md` |
| `/career-ops-training` | `modes/training.md` |
| `/career-ops-project` | `modes/project.md` |
| `/career-ops-patterns` | `modes/patterns.md` |
| `/career-ops-followup` | `modes/followup.md` |
| `/career-ops-interview-prep` | `modes/interview-prep.md` |

## Transfer Boundary

The reusable layer is:

- all `modes/*` files,
- all local scripts,
- all templates,
- all data contracts,
- all tracker and report formats.

The runtime-specific layer is:

- browser navigation,
- web search,
- subtask orchestration,
- permission behavior,
- tool failure recovery.

`modes/scan-opencode.md` exists only because scan depends heavily on runtime behavior. Other OpenCode commands load the shared modes directly.

## Verification

After changing OpenCode routing:

```bash
node doctor.mjs
git diff --check
GOCACHE=/tmp/career-ops-go-build-cache node test-all.mjs --quick
```
