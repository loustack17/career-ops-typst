# Mode: typst — Typst CV Export

Export a tailored, ATS-optimized CV as a `.typ` file and compile it to PDF via `typst compile`.

## Pipeline

1. Read `cv.md` as source of truth
2. Read `config/profile.yml` for candidate identity and contact info
3. Ask the user for the JD if not already in context (text or URL)
4. Extract 15-20 keywords from the JD
5. Detect JD language → CV language (EN default)
6. Detect role archetype → adapt framing
7. Rewrite Professional Summary injecting JD keywords (same rules as `pdf` mode — NEVER invent skills)
8. Select top 3-4 most relevant projects for the offer
9. Reorder experience bullets by JD relevance
10. Inject keywords naturally into existing achievements
11. Write a JSON payload to `output/{YYYY-MM-DD}/` with this structure:
    ```json
    {
      "meta": { "candidate_name": "...", "company": "...", "role": "...", "language": "en", "paper_size": "letter" },
      "identity": {
        "full_name": "...",
        "location": "... (from profile.yml)",
        "contacts": [
          {"href": "mailto:...", "display": "..."},           // email
          {"href": "https://linkedin.com/in/...", "display": "linkedin.com/in/..."},
          {"href": "https://github.com/...", "display": "github.com/..."},
          {"href": "https://portfolio-url", "display": "portfolio-url (no scheme)"}  // blog/portfolio
        ]
      },
      "summary": "...",
      "core_competencies": ["...", "..."],
      "experience": [ { "company": "...", "location": "...", "role": "...", "period": "...", "bullets": ["..."] } ],
      "projects": [ { "title": "...", "badge": "...", "description": "...", "tech": "..." } ],
      "education": [ { "title": "...", "institution": "...", "year": "...", "description": "..." } ],
      "certifications": [ { "title": "...", "issuer": "...", "year": "..." } ],
      "skills": [ { "category": "...", "items": ["..."] } ]
    }
    ```
    **CRITICAL:** Pull all identity fields (full_name, location, email, linkedin, github, portfolio_url) from `config/profile.yml`. Never invent or omit contact info.
12. Run: `typst compile --root . --input payload=../output/{YYYY-MM-DD}/payload.json templates/cv.typ output/{YYYY-MM-DD}/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`
13. **Delete** `payload.json` from `output/{YYYY-MM-DD}/` — keep only the PDF
14. Report: PDF path, file size, section count, keyword coverage %

**Requires:** `typst` on PATH (`brew install typst` or `cargo install typst-cli`).

## Template

Multi-file: `templates/cv.typ` (master) + `templates/cv/*.typ` (sub-templates)
Fonts: `fonts/Inter-*.ttf`

## Typst Content Generation Rules

### CV Data Injection

Populate `templates/cv-template.typ` with data from `cv.md` and `config/profile.yml`:

| Section | Source |
|---------|--------|
| Header (name, contact, links) | `profile.yml` |
| Education | `cv.md` Education section |
| Experience | `cv.md` Work Experience section |
| Projects | `cv.md` Projects section (top 3-4) |
| Skills | `cv.md` Technical Skills section |

### Keyword Injection (same rules as pdf/latex modes)

Same ethical rules as `modes/pdf.md`:
- NEVER add skills the candidate doesn't have
- Only reformulate existing experience using JD vocabulary
- Examples:
  - JD says "RAG pipelines" → reword "LLM workflows with retrieval" to "RAG pipeline design"
  - JD says "MLOps" → reword "observability, evals" to "MLOps and observability"

## ATS Rules

- Single-column layout
- Standard section headers: Education, Work Experience, Personal Projects, Technical Skills
- Machine-readable output
- Keywords distributed: first bullet of each role, skills section
- No images, no graphics, no color in body text
- UTF-8 encoded
