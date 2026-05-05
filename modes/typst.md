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
11. Generate the `.typ` file using `templates/cv.typ` (master) and `templates/cv/*.typ` (sub-templates)
12. Write to `output/{YYYY-MM-DD}/cv-{candidate}-{company}-{YYYY-MM-DD}.typ`
13. Run: `typst compile output/{YYYY-MM-DD}/cv-{candidate}-{company}-{YYYY-MM-DD}.typ output/{YYYY-MM-DD}/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`
14. Report: .typ path, .pdf path, file sizes, section count, keyword coverage %

**Requires:** `typst` on PATH (`brew install typst` or `cargo install typst-cli`).

## Template Structure

Master template: `templates/cv.typ`
Sub-templates: `templates/cv/config.typ`, `templates/cv/education.typ`, `templates/cv/experience.typ`, `templates/cv/header.typ`, `templates/cv/projects.typ`, `templates/cv/shared.typ`, `templates/cv/skills.typ`
Fonts: `fonts/Inter-*.ttf`

## Typst Content Generation Rules

### CV Data Injection

The master template `templates/cv.typ` imports sub-templates. Populate the template with data from `cv.md` and `config/profile.yml`:

| Section | Source | Typst template |
|---------|--------|----------------|
| Header (name, contact, links) | `profile.yml` | `templates/cv/header.typ` |
| Education | `cv.md` Education section | `templates/cv/education.typ` |
| Experience | `cv.md` Work Experience section | `templates/cv/experience.typ` |
| Projects | `cv.md` Projects section (top 3-4) | `templates/cv/projects.typ` |
| Skills | `cv.md` Technical Skills section | `templates/cv/skills.typ` |

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
