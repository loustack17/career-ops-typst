# Mode: scan — Portal Scanner (Job Discovery)

Scans configured job portals, filters by title relevance, and adds new offers to the pipeline for later evaluation.

> **Note (v1.5+):** The default scanner (`scan.mjs` / `npm run scan`) is **zero-token** and only directly queries the public APIs of Greenhouse, Ashby, and Lever. The Playwright/WebSearch levels described below are the **agent** flow (run by Claude/Codex), not what `scan.mjs` does. If a company does not have a Greenhouse/Ashby/Lever API, `scan.mjs` will ignore it; for those cases, the agent must manually complete Level 1 (Playwright) or Level 3 (WebSearch).

## Recommended execution

Run as subagent to avoid consuming main context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[content of this file + specific data]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml` which contains:
- `search_queries`: List of WebSearch queries with `site:` filters per portal (broad discovery)
- `tracked_companies`: Specific companies with `careers_url` for direct navigation
- `title_filter`: Positive/negative/seniority_boost keywords for title filtering

## Discovery strategy (3 levels)

### Level 1 — Direct Playwright (PRIMARY)

**For each company in `tracked_companies`:** Navigate to its `careers_url` with Playwright (`browser_navigate` + `browser_snapshot`), read ALL visible job listings, and extract title + URL from each one. This is the most reliable method because:
- Sees the page in real time (not cached Google results)
- Works with SPAs (Ashby, Lever, Workday)
- Detects new offers instantly
- Does not depend on Google indexing

**Each company MUST have `careers_url` in portals.yml.** If it doesn't, find it once, save it, and use it in future scans.

### Level 2 — ATS APIs / Feeds (COMPLEMENTARY)

For companies with a public API or structured feed, use the JSON/XML response as a fast complement to Level 1. It is faster than Playwright and reduces visual scraping errors.

**Current support (variables between `{}`):**
- **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- **Ashby**: `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR**: list `https://{company}.bamboohr.com/careers/list`; job detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Lever**: `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor**: `https://{company}.teamtailor.com/jobs.rss`
- **Workday**: `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Parsing conventions by provider:**
- `greenhouse`: `jobs[]` → `title`, `absolute_url`
- `ashby`: GraphQL `ApiJobBoardWithTeams` with `organizationHostedJobsPageName={company}` → `jobBoard.jobPostings[]` (`title`, `id`; build public URL if not in payload)
- `bamboohr`: list `result[]` → `jobOpeningName`, `id`; build detail URL `https://{company}.bamboohr.com/careers/{id}/detail`; to read the full JD, GET the detail and use `result.jobOpening` (`jobOpeningName`, `description`, `datePosted`, `minimumExperience`, `compensation`, `jobOpeningShareUrl`)
- `lever`: root array `[]` → `text`, `hostedUrl` (fallback: `applyUrl`)
- `teamtailor`: RSS items → `title`, `link`
- `workday`: `jobPostings[]`/`jobPostings` (depending on tenant) → `title`, `externalPath` or URL built from host

### Level 3 — WebSearch queries (BROAD DISCOVERY)

The `search_queries` with `site:` filters cover portals transversally (all Ashby, all Greenhouse, etc.). Useful for discovering NEW companies not yet in `tracked_companies`, but results may be outdated.

**Execution priority:**
1. Level 1: Playwright → all `tracked_companies` with `careers_url`
2. Level 2: API → all `tracked_companies` with `api:`
3. Level 3: WebSearch → all `search_queries` with `enabled: true`

The levels are additive — all are executed, results are merged and deduplicated.

### LinkedIn in Level 3

LinkedIn should NOT be treated as a direct crawling portal within `scan`. Public search pages typically redirect to login. The correct usage within this project is:

1. Discover LinkedIn URLs via WebSearch or another reliable external source
2. If the URL is from LinkedIn (`jobs/view/...` or `search-results?currentJobId=...`), resolve it locally with:

```bash
node resolve-linkedin.mjs '<linkedin-url>' \
  --add-to-pipeline \
  --keep-lead \
  --title '<job-title>' \
  --company '<company-name>' \
  --query-name '<query-name>'
```

The resolver:
- normalizes the URL to `https://www.linkedin.com/jobs/view/{id}/`
- extracts the public JD with Playwright if accessible
- saves a local file in `jds/`
- adds `local:jds/...` to `data/pipeline.md`
- registers the canonical URL in `data/scan-history.tsv`
- if LinkedIn blocks or does not expose enough detail, retains the lead in `On Hold — Manual Verify` using the title and company already discovered by search

If LinkedIn only exposes a search page that redirects to login and there is no concrete job URL, do NOT add anything to `Pending`.

### Indeed in Level 3

Indeed can be discovered with WebSearch, but its URLs come in different formats (`viewjob?jk=...` or `?vjk=...`). The correct usage is:

```bash
node resolve-indeed.mjs '<indeed-url>' \
  --add-to-pipeline \
  --keep-lead \
  --title '<job-title>' \
  --company '<company-name>' \
  --query-name '<query-name>'
```

The resolver:
- normalizes `jk` and `vjk` URLs to `https://{host}/viewjob?jk={id}`
- attempts to extract the public JD with Playwright
- saves a local file in `jds/`
- adds `local:jds/...` to `data/pipeline.md`
- registers the canonical URL in `data/scan-history.tsv`
- if Indeed returns a Cloudflare block or insufficient metadata, retains the lead in `On Hold — Manual Verify` using the title and company already discovered by search

If Indeed returns a Cloudflare-blocked page or does not expose reliable metadata, do NOT add anything to `Pending` unless the resolver can retain the lead in `On Hold — Manual Verify`.

## Workflow

1. **Read configuration**: `portals.yml`
2. **Read history**: `data/scan-history.tsv` → URLs already seen
3. **Read dedup sources**: `data/applications.md` + `data/pipeline.md`

4. **Level 1 — Playwright scan** (parallel in batches of 3-5):
   For each company in `tracked_companies` with `enabled: true` and `careers_url` defined:
   a. `browser_navigate` to the `careers_url`
   b. `browser_snapshot` to read all job listings
   c. If the page has filters/departments, navigate relevant sections
   d. For each job listing extract: `{title, url, company}`
   e. If the page paginates results, navigate additional pages
   f. Accumulate in candidate list
   g. If `careers_url` fails (404, redirect), try `scan_query` as fallback and note to update the URL

5. **Level 2 — ATS APIs / feeds** (parallel):
   For each company in `tracked_companies` with `api:` defined and `enabled: true`:
   a. WebFetch of the API/feed URL
   b. If `api_provider` is defined, use its parser; if not defined, infer by domain (`boards-api.greenhouse.io`, `jobs.ashbyhq.com`, `api.lever.co`, `*.bamboohr.com`, `*.teamtailor.com`, `*.myworkdayjobs.com`)
   c. For **Ashby**, send POST with:
      - `operationName: ApiJobBoardWithTeams`
      - `variables.organizationHostedJobsPageName: {company}`
      - GraphQL query for `jobBoardWithTeams` + `jobPostings { id title locationName employmentType compensationTierSummary }`
   d. For **BambooHR**, the list only brings basic metadata. For each relevant item, read `id`, GET `https://{company}.bamboohr.com/careers/{id}/detail`, and extract the full JD from `result.jobOpening`. Use `jobOpeningShareUrl` as public URL if present; otherwise, use the detail URL.
   e. For **Workday**, send POST JSON with at least `{"appliedFacets":{},"limit":20,"offset":0,"searchText":""}` and paginate by `offset` until results are exhausted
   f. For each job extract and normalize: `{title, url, company}`
   g. Accumulate in candidate list (dedup with Level 1)

6. **Level 3 — WebSearch queries** (parallel if possible):
   For each query in `search_queries` with `enabled: true`:
   a. Run WebSearch with the defined `query`
   b. From each result extract: `{title, url, company}`
      - **title**: from the result title (before the " @ " or " | ")
      - **url**: result URL
      - **company**: after the " @ " in the title, or extract from domain/path
   c. Accumulate in candidate list (dedup with Level 1+2)
   d. If the result is a LinkedIn URL:
      - Do NOT add the raw URL directly to `pipeline.md`
      - Resolve it with `node resolve-linkedin.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>' --query-name '<query_name>'`
      - If the resolver returns `kept_lead`, leave the offer in `On Hold — Manual Verify`
      - If the resolver fails without sufficient metadata, register as `skipped_expired` or `skipped_title` as appropriate and continue
      - If the resolver already knows it by canonical URL or company+role, treat it as duplicate
   e. If the result is an Indeed URL:
      - Do NOT add the raw URL directly to `pipeline.md`
      - Resolve it with `node resolve-indeed.mjs '<url>' --add-to-pipeline --keep-lead --title '<title>' --company '<company>' --query-name '<query_name>'`
      - If the resolver returns `kept_lead`, leave the offer in `On Hold — Manual Verify`
      - If the resolver returns `blocked`, `unresolved`, or `expired` without sufficient metadata, do not promote the result
      - If the resolver already knows it by canonical URL or company+role, treat it as duplicate

6. **Filter by title** using `title_filter` from `portals.yml`:
   - At least 1 `positive` keyword must appear in the title (case-insensitive)
   - 0 `negative` keywords must appear
   - `seniority_boost` keywords give priority but are not required

7. **Deduplicate** against 3 sources:
   - `scan-history.tsv` → exact URL already seen
   - `applications.md` → normalized company + role already evaluated
   - `pipeline.md` → exact URL already pending or processed

7.5. **Verify liveness of WebSearch results (Level 3)** — BEFORE adding to pipeline:

   WebSearch results may be outdated (Google caches results for weeks or months). To avoid evaluating expired offers, verify with Playwright each new URL coming from Level 3. Levels 1 and 2 are inherently real-time and do not require this verification.

   For each new URL from Level 3 (sequential — NEVER Playwright in parallel):
   a. `browser_navigate` to the URL
   b. `browser_snapshot` to read the content
   c. Classify:
      - **Active**: visible job title + role description + visible Apply/Submit control within the main content. Do not count generic header/navbar/footer text.
      - **Expired** (any of these signals):
        - Final URL contains `?error=true` (Greenhouse redirects this way when the offer is closed)
        - Page contains: "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found"
        - Only navbar and footer visible, no JD content (content < ~300 chars)
   d. If expired: register in `scan-history.tsv` with status `skipped_expired` and discard
   e. If active: continue to step 8

   **Do not interrupt the entire scan if a URL fails.** If `browser_navigate` errors (timeout, 403, etc.), mark as `skipped_expired` and continue with the next.

   **LinkedIn exception:** if the URL was already resolved by `resolve-linkedin.mjs` and converted to `local:jds/...`, do not re-verify the original URL in this step.
   **Indeed exception:** if the URL was already resolved by `resolve-indeed.mjs` and converted to `local:jds/...`, do not re-verify the original URL in this step.

8. **For each verified new offer that passes filters**:
   a. Add to `pipeline.md` "Pending" section: `- [ ] {url} | {company} | {title}`
   b. Register in `scan-history.tsv`: `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

9. **Offers filtered by title**: register in `scan-history.tsv` with status `skipped_title`
10. **Duplicate offers**: register with status `skipped_dup`
11. **Expired offers (Level 3)**: register with status `skipped_expired`

## Title and company extraction from WebSearch results

WebSearch results come in format: `"Job Title @ Company"` or `"Job Title | Company"` or `"Job Title — Company"`.

Extraction patterns by portal:
- **Ashby**: `"Senior AI PM (Remote) @ EverAI"` → title: `Senior AI PM`, company: `EverAI`
- **Greenhouse**: `"AI Engineer at Anthropic"` → title: `AI Engineer`, company: `Anthropic`
- **Lever**: `"Product Manager - AI @ Temporal"` → title: `Product Manager - AI`, company: `Temporal`

Generic regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If a publicly inaccessible URL is found:
1. Save the JD in `jds/{company}-{role-slug}.md`
2. Add to pipeline.md as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan History

`data/scan-history.tsv` tracks ALL seen URLs:

```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby — AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby — AI PM	SA AI	OldCo	skipped_dup
https://...	2026-02-10	WebSearch — AI PM	PM AI	ClosedCo	skipped_expired
```

## Output summary

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries executed: N
Offers found: N total
Filtered by title: N relevant
Duplicates: N (already evaluated or in pipeline)
Expired discarded: N (dead links, Level 3)
New added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

→ Run /career-ops pipeline to evaluate the new offers.
```

## careers_url management

Each company in `tracked_companies` must have `careers_url` — the direct URL to its job board. This avoids looking it up every time.

**RULE: Always use the company's corporate URL; fall back to the ATS endpoint only if no dedicated corporate page exists.**

The `careers_url` should point to the company's own careers page whenever available. Many companies use Workday, Greenhouse, or Lever underneath but only expose job IDs through their corporate domain. Using the direct ATS URL when a corporate page exists can cause false 410 errors because the posting IDs do not match.

| ✅ Correct (corporate) | ❌ Incorrect as first option (direct ATS) |
|---|---|
| `https://careers.mastercard.com` | `https://mastercard.wd1.myworkdayjobs.com` |
| `https://openai.com/careers` | `https://job-boards.greenhouse.io/openai` |
| `https://stripe.com/jobs` | `https://jobs.lever.co/stripe` |

Fallback: if you only have the direct ATS URL, first navigate to the company website and locate its corporate careers page. Use the direct ATS URL only if the company does not have a dedicated corporate page.

**Known patterns by platform:**
- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **BambooHR:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/{site}`
- **Custom:** The company's own URL (e.g., `https://openai.com/careers`)

**API/feed patterns by platform:**
- **Ashby API:** `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR API:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail` (`result.jobOpening`)
- **Lever API:** `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor RSS:** `https://{company}.teamtailor.com/jobs.rss`
- **Workday API:** `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**If `careers_url` does not exist** for a company:
1. Try the pattern for its known platform
2. If it fails, do a quick WebSearch: `"{company}" careers jobs`
3. Navigate with Playwright to confirm it works
4. **Save the found URL in portals.yml** for future scans

**If `careers_url` returns 404 or redirect:**
1. Note in the output summary
2. Try scan_query as fallback
3. Flag for manual update

## portals.yml maintenance

- **ALWAYS save `careers_url`** when adding a new company
- Add new queries as interesting portals or roles are discovered
- Disable queries with `enabled: false` if they generate too much noise
- Adjust filtering keywords as target roles evolve
- Add companies to `tracked_companies` when you want to follow them closely
- Periodically verify `careers_url` — companies change ATS platforms
