# OpenCode Agentic Scan

This document describes the OpenCode runtime path for Career-Ops scan.

The goal is parity with the original agentic scan behavior: browser-driven careers-page scanning, ATS/API supplements, WebSearch discovery, liveness verification, deduplication, and pipeline updates.

## What Changes

OpenCode gets its own scan execution layer:

- `.opencode/commands/career-ops-scan.md`
- `modes/scan-opencode.md`

The canonical scan strategy stays in `modes/scan.md`.

## What Stays Shared

These files and flows remain shared across Claude Code, OpenCode, Codex, and Gemini-style runtimes:

| Area | Shared files |
|------|--------------|
| Scan strategy | `modes/scan.md` |
| Evaluation | `modes/_shared.md`, `modes/oferta.md`, `modes/pipeline.md` |
| User profile | `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md` |
| Sources | `portals.yml` |
| Resolvers | `resolve-linkedin.mjs`, `resolve-indeed.mjs`, `check-liveness.mjs`, `liveness-core.mjs` |
| Pipeline state | `data/pipeline.md`, `data/scan-history.tsv`, `data/applications.md` |
| PDF generation | `modes/pdf.md`, `generate-pdf.mjs`, `templates/cv.typ`, `templates/cv/*` |
| Tracker merge | `batch/tracker-additions/*`, `merge-tracker.mjs`, `verify-pipeline.mjs` |

The runtime-specific part is only how the agent performs browser navigation, web search, subtask coordination, and tool fallback.

For the complete OpenCode command map, see `docs/OPENCODE.md`.

## Recommended Models

Use a frontier long-context model with reliable tool use. Strongly prefer:

- GPT-5.x-class frontier coding/agent models.
- DeepSeek V4 Pro-class frontier coding/agent models.
- Equivalent frontier models with strong browser, search, and file-operation reliability.

Use high reasoning for scan. Use cheaper models for triage after discovery if needed.

## Command

Start OpenCode from the project root so the Exa websearch launcher is used:

```bash
./opencode
```

Then inside OpenCode:

```text
/career-ops-scan
```

The command loads:

1. `modes/_shared.md`
2. `modes/scan.md`
3. `modes/scan-opencode.md`
4. `portals.yml`
5. profile and tracker files

It must run the full three-level scan:

1. Browser careers-page scan for `tracked_companies`.
2. ATS/API supplement.
3. WebSearch discovery across enabled `search_queries`.

`node scan.mjs` is only a supplement. It is not a complete scan.

## Parity Criteria

Compare OpenCode scan against a recent Claude scan on the same `portals.yml`:

| Metric | Meaning |
|--------|---------|
| Tracked companies attempted | Did it attempt the same careers pages? |
| Search queries attempted | Did it run the same enabled queries? |
| Added active JDs | Main success metric |
| False positives | Expired, wrong location, wrong role |
| Blocked sources | Search/browser/provider blockers |
| Duplicate handling | Repeated companies and roles skipped correctly |
| Token/cost notes | Relative scan cost |

Do not claim parity if OpenCode skips Level 1, skips Level 3, or fails to report blocked sources.

OpenCode cannot claim Claude parity if the configured WebSearch tool is blocked (e.g., Google Search 403 PERMISSION_DENIED) and no Level 3 fallback was attempted. The fallback order is defined in `modes/scan-opencode.md`. Report the blocker and the attempted fallbacks explicitly.

**Observed environment issues:** see `modes/scan-opencode.md` Level 3 fallback Step 4 for the canonical blocker list. These are tool-authorization/rendering issues, not scan logic defects. The fallback procedure is the mitigation.

## Expected Output

Every OpenCode scan should end with the summary format defined in `modes/scan-opencode.md`.

The next step after a successful scan is:

```text
/career-ops-pipeline
```

Run it only on candidates added to `data/pipeline.md` unless the user asks to process older pending items too.
