# Mode: scan-codex -- Codex Runtime Adapter for `modes/scan.md`

This file is the Codex runtime adapter for `modes/scan.md`. It does NOT redesign scan. It ensures Codex executes the canonical scan strategy with the same coverage as the Claude Code reference run.

Load this file alongside `modes/scan.md` when running `$career-ops-scan` under Codex.

## Runtime Contract

`modes/scan.md` is the canonical scan strategy. Codex must still attempt all three discovery levels:

1. **Level 1** -- browser scan of `tracked_companies` careers pages.
2. **Level 2** -- ATS/API supplement (`node scan.mjs` plus direct API queries).
3. **Level 3** -- search discovery for unknown companies.

`node scan.mjs` alone is **not** a full scan. It is Level 2 only. Skipping Level 1 or Level 3 to save tokens or time is a parity failure -- report it as a blocker, do not silently degrade.

## Tool Mapping

Translate the Claude-native steps in `modes/scan.md` to Codex equivalents:

| Scan capability | Codex execution |
|---|---|
| `browser_navigate` + `browser_snapshot` (Level 1, liveness) | Codex Playwright/browser tool, or `node check-liveness.mjs` for the liveness shortcut |
| `WebFetch` against ATS APIs (Level 2) | Codex shell/HTTP tool, or `node scan.mjs` for the supported providers |
| `WebSearch` (Level 3) | Codex search tool. If blocked, follow the Level 3 fallback chain below |
| `Agent(subagent_type=...)` orchestration | Codex subagent dispatch (see "Subagent Dispatch" below). If subagents are unavailable, run inline |
| LinkedIn URL handling | `node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<t>' --company '<c>' --query-name '<q>'` |
| Indeed URL handling | `node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<t>' --company '<c>' --query-name '<q>'` |
| Pipeline writes | Edit `data/pipeline.md` and append to `data/scan-history.tsv` per `modes/scan.md` |

If a tool has no equivalent in the current Codex runtime, mark that source as **blocked** in the final summary and report which fallback steps were attempted.

## Translating Claude `Agent(...)` Calls

`modes/scan.md` recommends running scan as a subagent:

```text
Agent(
    subagent_type="general-purpose",
    prompt="[content of this file + specific data]",
    run_in_background=True
)
```

Under Codex, do **not** wrap the entire scan in a single subagent. Codex subagents are best used as **bounded sidecars**, not as scan orchestrators. The parent agent owns the orchestration, dedup, and writes.

For Career-Ops scan parity with the Claude Code reference flow, dispatch scan sidecars by default when Codex exposes a subagent / delegate-task primitive. `$career-ops-scan` itself is explicit authorization for scan subagents because the canonical mode is agentic. If subagents are unavailable in the current runtime, run inline and report the capability gap.

When Codex exposes a subagent / delegate-task primitive, dispatch sidecar work as follows:

| Sidecar workload | Subagent scope |
|---|---|
| Level 1 careers pages | One subagent per 3-5 companies; each returns a list of `{company, title, url, location}` |
| Level 2 direct ATS calls | Parent runs `node scan.mjs --dry-run` once; subagents only inspect configured APIs not covered by `scan.mjs` |
| Level 3 search queries | One subagent per 3-5 queries; each returns raw search results with provenance |
| LinkedIn/Indeed enrichment | One subagent per concrete URL group (resolver-only, no pipeline writes) |
| Fallback investigation | One subagent per blocked search source to attempt the Level 3 fallback chain |

If subagents are unavailable, run all phases inline and note that in the final summary. If the user explicitly says not to use subagents, respect that and run inline.

## Parent Agent Ownership

The parent (Codex main agent) always owns:

- Final dedup against `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md`.
- Liveness classification (active vs expired vs blocked vs manual_verify).
- Writes to `data/pipeline.md` and `data/scan-history.tsv`.
- LinkedIn/Indeed resolver dispatch when the resolver writes to the pipeline.
- Final summary message to the user.

Subagents must NOT write to `data/*` directly. They return structured results; the parent merges and writes.

## Data Loading Rule (token discipline)

Do not load full `data/scan-history.tsv`, `data/pipeline.md`, or `data/applications.md` at scan start. Load them only after collecting candidate URLs, then read just what is needed for dedup.

For dedup:

- Build the candidate set in memory.
- Write candidate URLs and normalized `company + role` keys to a temp pattern file.
- Run one batched `rg -F -f` per dedup source instead of one grep per candidate.
- Check `data/scan-history.tsv`, `data/pipeline.md`, and `data/applications.md` without loading full files into context unless they are small.

Codex shell can use `rg`, `grep`, or `awk` to filter dedup sources without loading them into the model context.

## Level 1 / 2 / 3 Execution

Apply the canonical procedures in `modes/scan.md` using the Codex tool mapping above. Codex-specific notes:

- **Level 1:** add candidates with source `level1_browser`. On `careers_url` 404 / redirect / JS error, record `careers_url_failure`, try the company's `scan_query` fallback, and flag the URL for `portals.yml` update in the final summary.
- **Level 2:** run `node scan.mjs --dry-run` once first (Greenhouse, Ashby, Lever, Workday, SmartRecruiters), then run `node scan.mjs` when ready to write. For configured `api:` blocks not covered by `scan.mjs`, call the endpoint directly via the shell/HTTP tool using the parsing conventions in `modes/scan.md`. Delegate only uncovered provider/API blocks; do not make multiple subagents repeat the full scanner.
- **Level 3:** run the configured Codex search tool. Route LinkedIn through `resolve-linkedin.mjs`, Indeed through `resolve-indeed.mjs`. For other URLs, schedule a sequential liveness check before pipeline writes. If the search tool is blocked, follow the fallback chain below.

### Level 3 Fallback Chain

If the Codex search tool returns 403, timeout, challenge, empty results, or is unavailable, do not silently skip Level 3. Attempt the following in order. Stop after the first success per query and record outcomes for the summary.

1. **`r.jina.ai` readable fetch.** Fetch search result pages or known job board search URLs through `https://r.jina.ai/https://...`. This bypasses JS rendering and most anti-bot.
2. **Direct portal search URLs** for companies associated with the failed query or configured matching portal slugs. Cap attempts per query and record skipped fallback breadth:
   - Ashby: `https://jobs.ashbyhq.com/{company}?search={terms}`
   - Greenhouse: `https://job-boards.greenhouse.io/{company}?query={terms}`
   - Lever: `https://jobs.lever.co/{company}?search={terms}`
   - Workday: navigate to the configured corporate careers URL.
   - SmartRecruiters: navigate to the configured company careers URL.
3. **Public job boards** (treat as discovery only -- still route through resolvers if results are LinkedIn/Indeed). Cap attempts per query and record skipped fallback breadth:
   - DuckDuckGo: `https://duckduckgo.com/?q={encoded_query}`
   - Bing: `https://www.bing.com/search?q={encoded_query}`
   - Sector boards from `portals.yml`.
4. **User-provided result pages** when supplied (cached HTML, exported listings).

If all fallbacks fail for a query, mark the source as **blocked** with the failure reason and recommended next action.

## Liveness, Filtering, Writes

Use `modes/scan.md` for the liveness checks, filter ordering, status taxonomy (`skipped_*`, `blocked`, `manual_verify`), and the `data/pipeline.md` / `data/scan-history.tsv` write format. Codex-specific note: run liveness sequentially -- parallel browser sessions trigger anti-bot escalation.

LinkedIn and Indeed URLs skip browser-based liveness; use the resolver scripts.

## Smoke Test Constraint

When the user asks for a smoke test (e.g. `$career-ops-scan smoke test only, no writes`), do NOT modify any of:

- `data/pipeline.md`
- `data/scan-history.tsv`
- `data/applications.md`
- `reports/`
- `output/`

Report what would have been added, duplicated, expired, or blocked. See `docs/CODEX-SCAN.md` for the full smoke test contract.

## Required Final Summary

End every Codex scan with the same structured summary that `modes/scan.md` calls for, plus these Codex-specific fields:

```text
Runtime: codex (model: <model>)
Subagents available: yes/no
Subagents used: yes/no
Level 3 fallback attempts: list
```

If subagents were unavailable, say so. If Level 3 was blocked and no fallback succeeded, list every fallback attempt and its outcome explicitly. Honest blocker reporting is better than false parity claims.

## Parity Rule

The Codex scan is successful only if it preserves canonical `modes/scan.md` behavior. Judge by:

- Coverage of all enabled `tracked_companies` and `search_queries`.
- Active JD additions (true positives).
- False positives (expired or off-spec roles added).
- Duplicate handling.
- Token / cost efficiency without losing levels.

If Codex finds materially fewer candidates than a recent Claude reference scan, do not claim parity -- report the gap and the blocker.
