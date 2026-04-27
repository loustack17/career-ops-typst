# Mode: scan-opencode -- OpenCode Agentic Scan Runtime

This mode is the OpenCode execution layer for the canonical scan spec in `modes/scan.md`.

`modes/scan.md` remains the source of truth for scan strategy. This file only maps that strategy onto OpenCode so the same agentic scan capability can run outside the original Claude Code runtime.

## Goal

Run the full agentic portal scan from `modes/scan.md` in OpenCode without reducing coverage:

1. Level 1: browse `tracked_companies` careers pages directly.
2. Level 2: use ATS APIs and feeds as a fast supplement.
3. Level 3: execute enabled `search_queries` for broad discovery.
4. Resolve LinkedIn and Indeed URLs with local resolvers.
5. Verify liveness for WebSearch discoveries.
6. Deduplicate against scan history, pipeline, and tracker.
7. Add only verified relevant jobs to `data/pipeline.md`.

Do not replace this flow with `node scan.mjs` alone. `scan.mjs` is a zero-token supplement, not the complete scan.

## Recommended Runtime

Use a frontier long-context model with strong tool use, browser navigation, web search, and file editing reliability. Recommended class:

- GPT-5.x-class frontier coding/agent models.
- DeepSeek V4 Pro-class frontier coding/agent models.
- Equivalent models with long context, stable tool calls, and strong browser reasoning.

Use the highest practical reasoning mode for `scan`. Lower-cost models are acceptable for follow-up triage after candidates have already been discovered.

## Shared Career-Ops Files

Read these files before scanning:

| File | Use |
|------|-----|
| `modes/_shared.md` | Shared evaluation and safety rules |
| `modes/scan.md` | Canonical scan strategy |
| `modes/scan-opencode.md` | OpenCode runtime mapping |
| `portals.yml` | Source configuration |
| `config/profile.yml` | Candidate constraints and targeting |
| `modes/_profile.md` | User-specific positioning |
| `data/scan-history.tsv` | URL dedup history |
| `data/pipeline.md` | Pending and processed inbox |
| `data/applications.md` | Evaluated applications |

Do not write user-specific changes to `modes/_shared.md` or `modes/scan.md`.

## OpenCode Tool Mapping

Use the best available OpenCode tools for each scan phase:

| Canonical capability | OpenCode execution |
|----------------------|-------------------|
| Playwright browser scan | Use available browser/navigation tools, or local Playwright shell scripts when exposed |
| WebSearch discovery | Use the configured web search tool; if blocked, try another available search route and report the blocker |
| ATS/API fetch | Use shell or fetch tools for Greenhouse, Ashby, Lever, BambooHR, Teamtailor, Workday, and other configured APIs |
| LinkedIn resolution | Run `node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>' --query-name '<query>'` |
| Indeed resolution | Run `node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>' --query-name '<query>'` |
| Liveness check | Use browser navigation first; use `node check-liveness.mjs '<url>'` when a script path is more reliable |
| Pipeline writes | Edit `data/pipeline.md` and `data/scan-history.tsv` according to `modes/scan.md` |

If a tool is unavailable, use the nearest equivalent. If no equivalent exists, record that source as blocked instead of silently skipping it.

## Execution Protocol

### 0. Preflight

1. Confirm these files exist: `cv.md`, `config/profile.yml`, `modes/_profile.md`, `portals.yml`.
2. Read `portals.yml`.
3. Read dedup sources: `data/scan-history.tsv`, `data/pipeline.md`, `data/applications.md`.
4. Extract hard filters from `config/profile.yml` and `portals.yml`, especially location, title, seniority, salary, and remote policy.

### 1. Level 1 -- Browser Careers Scan

For every enabled `tracked_companies` entry with `careers_url`:

1. Navigate to the careers URL.
2. Read all visible job listings, including department filters and pagination.
3. Extract `company`, `title`, `url`, `location`, and visible metadata.
4. Apply title and location filters before reading full JDs.
5. Follow relevant job URLs only when the listing passes the initial filters.
6. Add candidates to the scan candidate set with source `level1_browser`.

Use batches of 3-5 only when the OpenCode runtime supports safe parallel agents. Otherwise scan sequentially and keep a resumable progress note in the final summary.

### 2. Level 2 -- ATS/API Supplement

Run the zero-token scanner as a supplement:

```bash
node scan.mjs
```

Also query any configured ATS/API endpoints directly when `portals.yml` provides enough data. Normalize every result to:

```json
{
  "company": "",
  "title": "",
  "url": "",
  "location": "",
  "source": "",
  "source_level": "level2_api"
}
```

Merge these results into the same candidate set as Level 1.

### 3. Level 3 -- Search Discovery

For every enabled `search_queries` entry:

1. Execute the query exactly as configured.
2. Extract concrete job URLs and metadata from each result.
3. Do not stop after tracked companies; Level 3 exists to discover companies not already known.
4. Treat LinkedIn and Indeed as discovery sources only and route them through the local resolvers.
5. Add candidates to the scan candidate set with source `level3_search`.

#### Level 3 Search Fallback Order

If the configured WebSearch tool returns 403, permission denied, challenge, timeout, or no usable results, do not silently skip Level 3. Execute the following fallbacks immediately and in order. You MUST attempt Step 1 before Step 2, Step 2 before Step 3, and so on. Record every attempt and its outcome in the final summary.

**Step 1 — r.jina.ai readable fetch**
Use `https://r.jina.ai/http://{url}` or `https://r.jina.ai/https://{url}` to fetch readable text from any public job page or search index. This is the most reliable fallback because it does not require JavaScript rendering.
- For search queries: fetch a known job board search results page via r.jina.ai (see Step 3 for job board URLs).
- For direct job URLs discovered elsewhere: fetch the listing via r.jina.ai to extract title, company, and description.

**Step 2 — Direct portal search/result URLs for tracked companies**
For each `tracked_companies` entry with a known careers URL, construct and browse the portal's search page directly:
- Ashby: `https://jobs.ashbyhq.com/{company}?search={terms}`
- Greenhouse: `https://job-boards.greenhouse.io/{company}?gh_jid=&query={terms}`
- Lever: `https://jobs.lever.co/{company}?search={terms}`
- BambooHR: `https://{company}.bamboohr.com/careers/list`
- Teamtailor: `https://{company}.teamtailor.com/jobs`
- Workday: browse the known corporate careers URL and use its search/filter UI.

**Step 3 — Source-specific public search pages / job boards**
Navigate directly to a public job board and use its search UI. Then use browser snapshot or r.jina.ai to read results.
- Canada: `https://www.eluta.ca/search?q={terms}&l=Toronto%2C+ON` or `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring={terms}`
- General: `https://www.linkedin.com/jobs/search/?keywords={terms}` (discovery only; route through resolver)
- General: `https://www.indeed.com/jobs?q={terms}` (discovery only; route through resolver)
- Sector boards from `portals.yml`.

**Step 4 — Browser-based search engine fallback**
Use browser navigation to a search engine with the query text, then extract result links.
- DuckDuckGo: `https://duckduckgo.com/?q={encoded_query}`
- Bing: `https://www.bing.com/search?q={encoded_query}`
- **Warning**: In the current OpenCode environment, DuckDuckGo may timeout after 30s and Bing may return empty results. If this happens, record it and proceed to Step 5.

**Step 5 — User-provided result pages**
If the user has supplied cached search result pages, feeds, or exported listings, parse them as a last resort and mark the source as `user_provided`.

After attempting fallbacks, record for each query:
- Query name and exact query text
- Primary failure reason (403, timeout, challenge, empty results)
- Which fallback steps were attempted and their outcomes
- Next recommended action

Do not claim the scan completed successfully if Level 3 was skipped without attempting all feasible fallback steps.

LinkedIn and Indeed URLs discovered through any fallback must still be routed through `resolve-linkedin.mjs` and `resolve-indeed.mjs` respectively. Do not add raw search URLs directly to `data/pipeline.md`.

### 4. Filtering

Apply filters in this order:

1. Hard location policy from `config/profile.yml` and `portals.yml`.
2. `title_filter.positive`.
3. `title_filter.negative`.
4. Seniority constraints.
5. Salary floor if salary is visible.
6. Dedup against scan history, pipeline, and tracker.

For ambiguous location, keep the candidate only if the posting clearly allows the user's target location or Canada-remote policy. Otherwise mark as skipped or on hold according to `modes/scan.md`.

### 5. Resolver Handling

Use the resolver commands from the OpenCode Tool Mapping table above.

Do not add raw LinkedIn or Indeed search pages directly to `data/pipeline.md`.

### 6. Liveness

Verify Level 3 non-resolver candidates before adding them to the pipeline:

1. Browser navigate to the URL.
2. Confirm the role title, JD body, and active apply control are present.
3. Treat explicit closed/expired signals as expired.
4. Treat 403, bot challenge, and login-wall pages as blocked or manual verify, not automatically expired.
5. Run liveness sequentially to avoid browser instability and anti-bot escalation.

Level 1 and Level 2 candidates can be treated as live unless the target page shows an explicit closed signal.

### 7. Writes

For every candidate promoted to pipeline:

1. Add to `data/pipeline.md` under pending items.
2. Add a row to `data/scan-history.tsv` with status `added`.

For skipped candidates, record the correct status where practical:

- `skipped_dup`
- `skipped_title`
- `skipped_location`
- `skipped_expired`
- `blocked`
- `manual_verify`

Never add candidates directly to `data/applications.md` during scan.

## Token Controls Without Coverage Loss

Use these controls to reduce token use without reducing scan capability:

1. Extract links and listing metadata before reading full pages.
2. Prefer DOM text around job cards over full page snapshots.
3. Save long JD text to `jds/` only after a candidate passes hard filters.
4. Summarize repeated blocked pages once per source.
5. Reuse `data/scan-history.tsv` aggressively for dedup.
6. Use scripts for normalization and resolver work.
7. Keep final output structured and compact.

Do not skip Level 1 or Level 3 to save tokens unless the user explicitly asks for a reduced scan.

## Required Final Summary

End every OpenCode scan with:

```text
OpenCode Agentic Scan Summary -- YYYY-MM-DD

Model/runtime:
Portals config:
Tracked companies attempted:
Search queries attempted:
Level 3 fallback attempts:
Level 1 candidates:
Level 2 candidates:
Level 3 candidates:
Added to pipeline:
Skipped duplicates:
Skipped title/location:
Expired:
Blocked/manual verify:
Token/cost notes:

Added:
- Company | Title | Location | Source | URL or local JD

Blocked sources:
- Source | Reason | Next action

Next:
Run /career-ops-pipeline on the added candidates.
```

## Parity Rule

The OpenCode scan is successful only if it preserves the canonical scan behavior from `modes/scan.md`. Judge it by coverage, active JD additions, false positives, duplicate handling, and token/cost reduction.

If OpenCode finds fewer candidates than a recent Claude scan, do not claim parity. Report the gap and the blocked source.

If the configured WebSearch tool is blocked and no Level 3 fallback was attempted, do not claim parity. Report the blocker and the missing fallback attempts explicitly.
