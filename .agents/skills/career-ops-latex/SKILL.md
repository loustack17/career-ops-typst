---
name: career-ops-latex
description: "Use $career-ops-latex to export the CV as LaTeX/Overleaf .tex when an Overleaf-friendly source is needed instead of the Typst PDF. Triggers: 'export CV to LaTeX', 'Overleaf CV', 'tex source for my CV'."
---

# Career-Ops LaTeX Export

Export `cv.md` as a LaTeX/Overleaf-compatible `.tex` source. Default PDF flow is Typst (`$career-ops-pdf`); use this skill only when the user explicitly needs LaTeX.

## Files to Load

- `modes/_shared.md`
- `modes/latex.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- Output goes to `output/` (gitignored).
- Do not invent metrics or experience. Mirror `cv.md` exactly.
- Prefer Typst (`$career-ops-pdf`) for everyday PDF generation. LaTeX is for Overleaf hand-off only.

See `AGENTS.md` for safety rules.
