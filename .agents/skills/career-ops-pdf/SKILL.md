---
name: career-ops-pdf
description: "Use $career-ops-pdf to generate an ATS-optimized CV PDF tailored to a target role. Triggers: 'generate CV PDF', 'tailor my CV', 'make a PDF for this role'."
---

# Career-Ops PDF

Generate an ATS-optimized CV PDF using the Typst templates.

## Files to Load

- `modes/_shared.md`
- `modes/pdf.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` if present

## Rules

- Use the Typst flow (`templates/cv.typ`, `generate-pdf.mjs`). Do not bypass it.
- Output filename must follow the convention in `modes/pdf.md`.
- Tailor the CV to the target role's keywords without inventing experience or metrics.
- Output goes to `output/` (gitignored).

See `AGENTS.md` for safety rules.
