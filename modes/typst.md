# Mode: typst — Typst CV Export

Export a tailored, ATS-optimized CV as PDF via `typst compile`.

## Pipeline

### Content generation (same rules as `pdf` mode)

1. Read `cv.md` as source of truth
2. Read `config/profile.yml` for candidate identity and contact info
3. Ask the user for the JD if not already in context (text or URL)
4. Extract 15-20 keywords from the JD
5. Detect JD language → CV language (EN default)
6. Detect company location → paper format:
   - US/Canada → `letter`
   - Rest of world → `a4`
7. Detect role archetype → adapt framing
8. Rewrite Professional Summary injecting JD keywords + exit narrative bridge ("Built and sold a business. Now applying systems thinking to [JD domain].") — **always start from cv.md's existing summary, not from scratch**
9. If cv.md has a dedicated Projects section with personal/side/open-source projects, select top 3-4 most relevant for the offer. If no such section exists, leave `projects` as an empty array — **NEVER synthesize projects from paid work experience**
10. Reorder experience bullets by JD relevance
11. Build competency grid from JD requirements (6-8 keyword phrases)
12. Inject keywords naturally into existing achievements (NEVER invent)

### Payload and compile (Typst-specific)

13. Read `candidate.full_name` from `config/profile.yml` → normalize to kebab-case lowercase (e.g. "John Doe" → "john-doe") → `{candidate}`
14. Write a JSON payload to `output/{YYYY-MM-DD}/payload.json` with this structure:
    ```json
    {
      "meta": {
        "candidate_name": "...",
        "company": "...",
        "role": "...",
        "language": "en",
        "paper_size": "letter",
        "source_jd": "URL or path to JD",
        "source_report": "path/to/report.md"
      },
      "identity": {
        "full_name": "...",
        "location": "... (from profile.yml)",
        "contacts": [
          {"href": "mailto:...", "display": "..."},
          {"href": "https://linkedin.com/in/...", "display": "linkedin.com/in/..."},
          {"href": "https://github.com/...", "display": "github.com/..."},
          {"href": "https://portfolio-url", "display": "portfolio-url (no scheme)"}
        ]
      },
      "summary": "... (from cv.md, rewritten with JD keywords)",
      "core_competencies": ["...", "..."],
      "experience": [{ "company": "...", "location": "...", "role": "...", "period": "...", "bullets": ["..."] }],
      "projects": [{ "title": "...", "badge": "...", "description": "...", "tech": "..." }],
      "education": [{ "title": "...", "institution": "...", "year": "...", "description": "..." }],
      "certifications": [{ "title": "...", "issuer": "...", "year": "..." }],
      "skills": [{ "category": "...", "items": ["..."] }]
    }
    ```
    **CRITICAL:** Pull all identity fields (full_name, location, email, linkedin, github, portfolio_url) from `config/profile.yml`. Never invent or omit contact info.
15. Run: `typst compile --root . --input payload=../output/{YYYY-MM-DD}/payload.json templates/cv-template.typ output/{YYYY-MM-DD}/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`
16. **Delete** `payload.json` from `output/{YYYY-MM-DD}/` — keep only the PDF
17. Report: PDF path, file size, section count, keyword coverage %

**Requires:** `typst` on PATH (`brew install typst` or `cargo install typst-cli`).

## Section order (optimized "6-second recruiter scan")

1. Header (large name, gradient, contact, portfolio link)
2. Professional Summary (3-4 lines, keyword-dense)
3. Core Competencies (6-8 keyword phrases in chip grid)
4. Work Experience (reverse chronological)
5. Projects (only if cv.md has a dedicated Projects section; omit otherwise)
6. Education & Certifications
7. Skills (languages + technical)

## Template

Single-file: `templates/cv-template.typ`
Fonts: `fonts/Inter-*.ttf`

### CV Data Injection

Populate the JSON payload with data from `cv.md` and `config/profile.yml`:

| Section | Source |
|---------|--------|
| Header (name, contact, links) | `profile.yml` → identity |
| Professional Summary | `cv.md` Summary, rewritten with JD keywords |
| Core Competencies | JD requirements → 6-8 phrases |
| Work Experience | `cv.md` Work Experience, bullets reordered by JD relevance |
| Projects | `cv.md` Projects section (top 3-4). **Empty array if no Projects section** |
| Education | `cv.md` Education section |
| Certifications | `cv.md` Certifications (override only if needed) |
| Skills | `cv.md` Technical Skills, reorganized for JD |

## Keyword injection strategy (ethical, truth-based)

Same rules as `modes/pdf.md`:

Examples of legitimate rewording:
- JD says "RAG pipelines" and CV says "LLM workflows with retrieval" → change to "RAG pipeline design and LLM orchestration workflows"
- JD says "MLOps" and CV says "observability, evals, error handling" → change to "MLOps and observability: evals, error handling, cost monitoring"
- JD says "stakeholder management" and CV says "collaborated with team" → change to "stakeholder management across engineering, operations, and business"

**NEVER add skills the candidate does not have. Only rephrase real experience using the exact vocabulary from the JD.**

## ATS Rules (same as pdf mode)

- Single-column layout (enforced by template)
- Standard section headers: "Professional Summary", "Work Experience", "Education", "Skills", "Certifications", "Projects"
- No text in images/SVGs
- No critical info in PDF headers/footers (ATS ignores them)
- UTF-8, selectable text (not rasterized)
- No nested tables
- JD keywords distributed: Summary (top 5), first bullet of each role, Skills section

## Post-generation

Update tracker if the offer is already registered: change PDF from ❌ to ✅.

## Cover Letter

The cover letter template (`templates/cover-letter-template.typ`) is minimal — only the letter content:

```
Dear Hiring Team,

[body paragraph 1]

[body paragraph 2]

[body paragraph 3]

Sincerely,

Lou Chang
```

No header, no contacts row, no date, no recipient address block. The CV already has all contact info.

**Payload structure for cover letter:**
```json
{
  "meta": { "candidate_name": "...", "company": "...", "role": "...", "language": "en", "paper_size": "letter" },
  "identity": { "full_name": "..." },
  "letter": {
    "salutation": "Dear Hiring Team,",
    "body": ["paragraph 1", "paragraph 2", "paragraph 3"],
    "closing": "Sincerely,"
  }
}
```

**Key differences from CV template:**
- No header/contacts — CV already has them
- Inter 11pt, 1.25in margins, no gradient or color
- `identity` only needs `full_name` (for the signature)
- `letter` only needs `salutation`, `body`, `closing`