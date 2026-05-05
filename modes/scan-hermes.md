# Scan -- Hermes Runtime Mapping

This file is the Hermes runtime adapter for `modes/scan.md`. It does NOT redesign scan. It ensures Hermes executes `modes/scan.md` with Claude-like thoroughness.

Load this file alongside `modes/scan.md` when running `/career-ops scan` under Hermes.

## Runtime Contract

`modes/scan.md` is the canonical scan strategy. Hermes must still attempt all three levels: browser careers pages, ATS/API scan, and search discovery. This file only maps those requirements to Hermes tools, subagents, and fallbacks.

## Tool Mapping

| Scan step | Hermes tool path |
|---|---|
| Level 1 careers pages | `browser_navigate` + `browser_snapshot` |
| Level 2 ATS/API | `node scan.mjs`; use `node scan.mjs --dry-run` inside subagents |
| Level 3 search | `web_search` + `web_extract`, then browser verification |
| Non-LinkedIn/Indeed liveness | `browser_navigate` + `browser_snapshot` |
| LinkedIn URLs | `node resolve-linkedin.mjs --add-to-pipeline` |
| Indeed URLs | `node resolve-indeed.mjs --add-to-pipeline` |

## Level 1: Browser-Driven Company Careers Pages

For each enabled company in `portals.yml` with a `careers_url`:
1. Use `browser_navigate` to open the careers page.
2. Use `browser_snapshot` to read the page content.
3. Extract job postings matching the user's target roles (from `config/profile.yml` `title_filter.positive`).
4. Collect posting titles, locations, and application URLs.

**Do not skip Level 1.** This is the primary discovery mechanism for tracked companies.

## Level 2: ATS/API Supplement

```bash
node scan.mjs
```

`scan.mjs` reads `portals.yml` and `config/profile.yml` automatically. It outputs results to `data/scan-history.tsv` and prints discovered URLs to stdout.

**Important:** When using subagents for Level 2, run `node scan.mjs --dry-run` in the subagent to collect URLs without writing to the pipeline. The parent agent collects Level 2 results and merges them through dedup before writing to the pipeline.

## Level 3: Search Discovery

For each `search_queries` entry in `portals.yml`:
1. Use `web_search` with the query string.
2. Extract job posting URLs from search results.
3. Verify each URL with `browser_navigate` + `browser_snapshot` to confirm the posting is still active.
4. Dedup new URLs against Level 1 and Level 2 results.

**Do not replace the full scan with `node scan.mjs` alone.** `scan.mjs` is Level 2 only. A complete scan requires all three levels.

## Subagent Dispatch

When Hermes `delegate_task` is available, split scan work across source groups:

| Source group | Subagent scope |
|---|---|
| Tracked companies (Level 1) | One subagent per 3-5 companies |
| ATS/API scan (Level 2) | Single subagent running `node scan.mjs --dry-run` |
| Search queries (Level 3) | One subagent per 3-5 queries |
| LinkedIn/Indeed resolvers | Separate subagents for each concrete URL |

Before dispatching, use the `subagent-driven-development` Superpowers skill if available.

**Merging rule:** All subagent outputs must be merged through the same dedup and liveness rules before writing to the pipeline. Do not write partial results independently.

If subagents are unavailable, run all levels inline.

## Dedup

Dedup new discoveries against:
- `data/scan-history.tsv` (previously seen URLs)
- `data/pipeline.md` (already in the inbox)
- `data/applications.md` (already evaluated/applied)

Do not add URLs that already appear in any of these files.

## Liveness Verification

Before adding a posting to the pipeline (except LinkedIn and Indeed URLs):
1. `browser_navigate` to the posting URL.
2. `browser_snapshot` to read content.
3. Only footer/navbar without JD = closed/expired. Title + description + Apply button = active.

For LinkedIn and Indeed URLs, use the resolver scripts instead of browser verification (these platforms block bots).

## LinkedIn & Indeed Resolvers

```bash
node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>'
```

Do not attempt to scrape LinkedIn or Indeed directly with browser tools.

## Fallback Behavior When Search Is Blocked

If `web_search` or `browser_navigate` fails for a search query, attempt these fallbacks before declaring Level 3 blocked. Stop after the first successful fallback for that query; otherwise summarize failures by category.

1. **Direct portal search URLs** — construct search URLs for the target ATS/job board and navigate directly.
2. **Readable fetch mirrors** — use `web_extract` on mirrors or cached versions if available.
3. **Browser-based search result pages** — navigate to search engine results pages and extract links.
4. **ATS public search pages** — use `browser_navigate` to the ATS company-specific search page.
5. **User-provided result pages** — ask the user to paste search result URLs.

Record blocked sources and fallback categories in the final summary.

**Do not silently skip Level 3.** If all fallbacks fail, explicitly report which queries were blocked and why.

## Uncertain Results

Do not add uncertain results as active postings. Keep them in pipeline as manual-verification leads only when:
- The source is valuable enough to keep.
- There is sufficient metadata (company, role, location) to make it actionable.

Otherwise, discard the result and report it in the summary.

## Final Summary Format

After completing the scan, produce a summary including ALL of:

- **Companies scanned** (Level 1): each company and postings found
- **ATS/API count** (Level 2): total jobs returned by `scan.mjs`
- **Search queries attempted** (Level 3): each query and result count
- **New active JDs added**: postings added to the pipeline
- **Duplicates skipped**: URLs already in scan-history/pipeline/applications
- **Expired removed or skipped**: postings no longer active
- **Blocked sources**: failed Level 1 or Level 3 attempts with error details
- **Fallback paths used**: which fallback methods succeeded
- **LinkedIn/Indeed resolver outcomes**: each URL processed and its result
- **Files modified**: files written to (pipeline.md, scan-history.tsv, etc.)

## Debugging

If a source is blocked, returns stale results, or produces no stable URLs, use the `systematic-debugging` Superpowers skill if available.
