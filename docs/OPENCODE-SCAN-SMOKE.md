# OpenCode Scan Smoke Test

Minimal smoke test to verify the OpenCode agentic scan runtime is wired correctly without running a full scan or modifying pipeline data.

## How to Start

Use the project launcher so `OPENCODE_ENABLE_EXA=1` is set automatically:

```bash
./opencode
```

Then run the smoke test command inside OpenCode:

```text
/career-ops-scan
```

## Warning

Do **not** run `/career-ops-pipeline`, `/career-ops-evaluate`, or `/career-ops-pdf` during a smoke test. This is a connectivity and routing check only.

Do **not** modify `data/pipeline.md`, `data/scan-history.tsv`, `reports/`, or `output/`.

## Smoke Test Prompt

```text
Run a minimal OpenCode scan smoke test:

1. Read the files listed in `.opencode/commands/career-ops-scan.md`.
2. Level 1: Browse 2 tracked companies' careers pages directly. Confirm HTTP 200 and that job listings are visible. Extract at least one job title per page.
3. Level 2: Run "node scan.mjs --dry-run". Report the result summary (companies scanned, jobs found, title-filtered, duplicates, new offers).
4. Level 3: Attempt ONE enabled search query. If WebSearch works, extract one concrete job URL. If WebSearch is blocked, attempt the fallback order from modes/scan-opencode.md and report which fallbacks were tried.
5. Do NOT write anything to data/pipeline.md or data/scan-history.tsv.
6. End with the OpenCode Agentic Scan Summary template from modes/scan-opencode.md, filling in only what was observed during this smoke test.
```

## Pass/Fail Criteria

| Check | Pass | Fail |
|-------|------|------|
| File loading | All required config and data files load without error | Missing files or parse errors |
| Level 1 browser | At least 2 careers pages return HTTP 200 with visible listings | Browser tool missing, pages fail, or no listings found |
| Level 2 dry-run | `node scan.mjs --dry-run` executes and reports counts | Script crashes or returns no output |
| Level 3 search | WebSearch returns usable results OR agent attempts at least one fallback from the ordered list in `modes/scan-opencode.md` | WebSearch blocked with no fallback attempted, or silent skip |
| No writes | `data/pipeline.md` and `data/scan-history.tsv` are unchanged | Any modifications to pipeline or history files |
| Summary | Agent outputs the required summary format | Summary missing or incomplete |

## Known Blockers

See `modes/scan-opencode.md` Level 3 fallback Step 4 for the canonical blocker list. The agent must attempt the fallback order when WebSearch is blocked.

A smoke test where WebSearch is blocked but the agent attempts at least Step 1 (r.jina.ai) and Step 2 or 3 of the fallback is a **pass with blocker noted**, not a fail.

## Interpreting Results

- **All checks pass**: OpenCode runtime is ready for full scans.
- **Level 1 or 2 fail**: Fix runtime tooling or script dependencies before running full scans.
- **Level 3 blocked with no fallback**: Update `modes/scan-opencode.md` fallback execution or runtime tool availability. Do not claim parity.
- **Level 3 blocked, fallback attempted but empty**: Document the blocker and which steps were tried. Parity is degraded but the runtime is functional.
- **Summary missing**: Agent did not load `modes/scan-opencode.md` correctly; verify command routing.
