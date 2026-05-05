# Career-Ops Codex Scan -- Parity Test Guide

This document defines the smoke test and full parity criteria for verifying that Codex scans match Claude Code's scan behavior.

`modes/scan.md` is the canonical scan strategy. `modes/scan-codex.md` is the Codex runtime adapter. Together they must produce a scan with the same coverage as a Claude Code reference run.

## Smoke Test

Run the following prompt in Codex:

```text
Run Career-Ops Codex scan smoke test only.
Load AGENTS.md, .codex/skills/career-ops/SKILL.md, modes/_shared.md, modes/scan.md,
modes/scan-codex.md, portals.yml, config/profile.yml, and modes/_profile.md.

Do not run pipeline, evaluate, generate reports, generate PDFs, or modify tracker files.

Test:
1. Browser-open two enabled tracked-company careers pages from portals.yml (Level 1).
2. Run `node scan.mjs --dry-run` (Level 2).
3. Attempt two Level 3 search_queries.
4. If search is blocked, attempt one fallback path from the Level 3 fallback chain and report it.
5. Report whether LinkedIn/Indeed resolvers would be invoked if concrete URLs were found.
6. Report whether Codex subagent dispatch is available in this runtime.
```

## Pass Criteria

The smoke test passes if ALL of the following are true:

1. **No data modification.** It does NOT modify `data/pipeline.md`, `data/scan-history.tsv`, `data/applications.md`, `reports/`, or `output/`.
2. **scan-codex loaded.** It loads `modes/scan-codex.md` as part of the scan context.
3. **All three levels attempted.** Level 1 (browser), Level 2 (ATS/API via `scan.mjs --dry-run`), Level 3 (search).
4. **Honest parity assessment.** It does NOT claim full parity if Level 3 is blocked and no fallback was attempted.
5. **Blocked sources reported.** It clearly reports which sources were blocked and why.
6. **Resolver awareness.** It identifies when LinkedIn / Indeed resolvers would be invoked for concrete URLs.
7. **Subagent reporting.** It reports whether Codex subagent dispatch is available, and would not wrap the entire scan in a single subagent.

The smoke test MAY read `data/scan-history.tsv`, `data/pipeline.md`, and `data/applications.md` for dedup-awareness reporting, and print what would have been added, duplicated, expired, or blocked. See `modes/scan-codex.md` "Smoke Test Constraint" for the no-write list.

## Full Scan Parity Criteria

Beyond the smoke test, full Claude Code scan parity requires:

1. **Same company coverage.** Codex attempts the same enabled `tracked_companies` and `search_queries` as Claude Code would.
2. **All levels executed.** Level 1 + Level 2 + Level 3, additive. Skipping a level is a parity failure.
3. **Quality filtering.** Codex adds only `active` or `manual_verify` JDs with sufficient metadata (company, role, location, URL).
4. **Resolver usage.** Codex routes concrete LinkedIn URLs through `resolve-linkedin.mjs` and Indeed URLs through `resolve-indeed.mjs`. It does NOT scrape those platforms directly.
5. **Dedup consistency.** Codex records duplicates and expired results consistently against `scan-history.tsv`, `pipeline.md`, and `applications.md`.
6. **Subagent discipline.** Sidecar tasks (per source group) only. Parent owns dedup, liveness, and writes.
7. **Token discipline without coverage loss.** Use `rg`/`grep` for dedup against large data files instead of loading them into context. Do NOT skip a level to save tokens.
8. **Summary completeness.** Codex produces the final summary required by `modes/scan-codex.md`, including `Subagents available: yes/no`, blocked sources, and fallback paths attempted.

## Honest Blocker Reporting

If a level cannot complete:

- Name the source (e.g. `Level 1: Acme careers_url 403`, `Level 3: WebSearch challenge`).
- Name the failure mode (403, timeout, challenge, empty, login wall, no equivalent tool).
- List which fallback steps were attempted (`r.jina.ai`, direct portal search, public boards, user-provided pages).
- State the recommended next action (update `careers_url`, ask user for cached results, retry later).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Level 1 skipped | Browser tool unavailable or `scan-codex.md` not loaded | Verify the Codex runtime exposes a browser/Playwright tool. Verify the skill router loads `modes/scan-codex.md` for `scan`. |
| Level 3 skipped entirely | Codex search tool unavailable or blocked | Attempt the Level 3 fallback chain (`r.jina.ai`, direct portal search, public boards). Record outcomes. |
| Only `node scan.mjs` ran (Level 2 only) | Codex degraded to ATS-only mode | Ensure `modes/scan-codex.md` is in context. Re-prompt with `Levels 1, 2, 3 are required`. |
| LinkedIn / Indeed URLs scraped directly | Resolvers not invoked | Verify `resolve-linkedin.mjs` and `resolve-indeed.mjs` exist and are executable. |
| Subagent wrapped the whole scan | Misread of `Agent(...)` in `modes/scan.md` | `modes/scan-codex.md` overrides this for Codex -- subagents are sidecars only. Re-load `modes/scan-codex.md`. |
| No final summary | Model stopped early | Reduce concurrent subagent load. Use a higher-capacity Codex model. |
| Duplicate entries in `data/pipeline.md` | Scan dedup missed existing entries | Remove duplicates manually. Run `node dedup-tracker.mjs` only if `data/applications.md` also has duplicate rows. |
| Wrote to data files during smoke test | Smoke test prompt not honored | Re-prompt with the explicit "no writes" constraint. The skill must respect smoke-test scope. |
