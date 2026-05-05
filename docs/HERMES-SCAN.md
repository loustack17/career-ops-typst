# Career-Ops Hermes Scan -- Parity Test Guide

This document defines the smoke test and full parity criteria for verifying that Hermes Agent scans match Claude Code's scan behavior.

## Smoke Test

Run the following prompt in Hermes:

```text
Run Career-Ops Hermes scan smoke test only.
Load HERMES.md, .hermes/skills/career-ops/SKILL.md, modes/_shared.md, modes/scan.md, modes/scan-hermes.md, portals.yml, config/profile.yml, and modes/_profile.md.
Do not run pipeline, evaluate, generate reports, generate PDFs, or modify tracker files.
Test:
1. Browser-open two enabled tracked-company careers pages from portals.yml.
2. Run node scan.mjs --dry-run.
3. Attempt two Level 3 search_queries.
4. If search is blocked, attempt one fallback path and report it.
5. Report whether LinkedIn/Indeed resolvers would be invoked if concrete URLs were found.
```

## Pass Criteria

The smoke test passes if ALL of the following are true:

1. **No data modification.** It does not modify `data/pipeline.md`, `data/scan-history.tsv`, `data/applications.md`, `reports/`, or `output/`.
2. **Scan-hermes loaded.** It loads `modes/scan-hermes.md` as part of the scan context.
3. **All three levels attempted.** It attempts Level 1 (browser), Level 2 (ATS/API), and Level 3 (search).
4. **Honest parity assessment.** It does not claim full parity if Level 3 is blocked and no fallback was attempted.
5. **Blocked sources reported.** It clearly reports which sources were blocked and why.
6. **Resolver awareness.** It identifies when LinkedIn/Indeed resolvers would be needed for concrete URLs.

## Full Scan Parity Criteria

Beyond the smoke test, full Claude Code scan parity requires:

1. **Same company coverage.** Hermes attempts the same enabled tracked companies and search queries as Claude Code would.
2. **Quality filtering.** Hermes adds only `active` or `on-hold/manual-verify` JDs with sufficient metadata (company, role, location, URL).
3. **Resolver usage.** Hermes uses LinkedIn and Indeed resolver scripts for concrete URLs instead of scraping those platforms directly.
4. **Dedup consistency.** Hermes records duplicates and expired results consistently against `scan-history.tsv`, `pipeline.md`, and `applications.md`.
5. **Summary completeness.** Hermes produces the final summary required by `modes/scan-hermes.md`.

## What Not To Test

During the smoke test:

- Do NOT run pipeline, evaluate, generate reports, or generate PDFs.
- Do NOT modify tracker files (`data/applications.md`, `data/pipeline.md`, `data/scan-history.tsv`).
- Do NOT write to `reports/` or `output/`.

Only run a real scan after the smoke test passes.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Level 1 skipped | Browser unavailable or Hermes not loading scan-hermes.md | Verify `hermes tools` includes browser tools. Verify SKILL.md loads `modes/scan-hermes.md` for scan. |
| Level 3 skipped entirely | `web_search` unavailable | Check `hermes tools` for search tools. Try browser-based search as fallback. |
| Only `node scan.mjs` ran (Level 2 only) | Model degraded to ATS-only mode | Ensure `modes/scan-hermes.md` is loaded in context. |
| LinkedIn/Indeed URLs scraped directly | Resolvers not invoked | Verify `resolve-linkedin.mjs` and `resolve-indeed.mjs` exist and are executable. |
| No final summary | Model stopped early | Use frontier long-context model. Reduce concurrent subagent load. |
| Duplicate entries in pipeline | Scan dedup missed existing URLs in scan-history/pipeline/applications | Remove duplicates manually from `data/pipeline.md`. Use `node dedup-tracker.mjs` only if `data/applications.md` also has duplicate tracker rows. |
