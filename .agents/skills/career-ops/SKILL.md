---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
arguments: mode # Claude Code; ignored by Codex/Hermes/Gemini/Qwen
user-invocable: true # Claude Code; ignored by others
argument-hint: "[scan | deep | pdf | typst | oferta | ofertas | apply | batch | tracker | pipeline | contacto | training | project | interview-prep | update]" # Claude Code; ignored by others
license: MIT
---

# career-ops -- Router

## Mode Routing

Determine the mode from `$mode`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `oferta` | `oferta` |
| `ofertas` | `ofertas` |
| `contacto` | `contacto` |
| `deep` | `deep` |
| `interview-prep` | `interview-prep` |
| `pdf` | `pdf` |
| `typst` | `typst` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |

**Auto-pipeline detection:** If `$mode` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `$mode` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu. Use your CLI's invocation prefix (`/career-ops` for CC/Hermes, `$career-ops` for Codex, `/career-ops-{sub}` for OpenCode/Gemini):

```
career-ops -- Command Center

Available commands:
  {invoke} {JD}          → AUTO-PIPELINE: evaluate + report + PDF + tracker (paste text or URL)
  {invoke} pipeline      → Process pending URLs from inbox (data/pipeline.md)
  {invoke} oferta        → Evaluation only A-F (no auto PDF)
  {invoke} ofertas       → Compare and rank multiple offers
  {invoke} contacto      → LinkedIn power move: find contacts + draft message
  {invoke} deep          → Deep research prompt about company
  {invoke} interview-prep → Generate company-specific interview prep doc
  {invoke} pdf           → PDF only, ATS-optimized CV
  {invoke} training      → Evaluate course/cert against North Star
  {invoke} project       → Evaluate portfolio project idea
  {invoke} tracker       → Application status overview
  {invoke} apply         → Live application assistant (reads form + generates answers)
  {invoke} scan          → Scan portals and discover new offers
  {invoke} batch         → Batch processing with parallel workers
  {invoke} patterns      → Analyze rejection patterns and improve targeting
  {invoke} followup      → Follow-up cadence tracker: flag overdue, generate drafts

Inbox: add URLs to data/pipeline.md → {invoke} pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + their mode file:
Read `modes/_shared.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `oferta`, `ofertas`, `pdf`, `typst`, `contacto`, `apply`, `pipeline`, `scan`, `batch`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`, `deep`, `interview-prep`, `training`, `project`, `patterns`, `followup`

### Modes delegated to subagent:
For `scan`, `apply` (with Playwright), and `pipeline` (3+ URLs): launch a subagent with the content of `_shared.md` + `modes/{mode}.md` injected into the subagent prompt. Use your CLI's spawn mechanism (`Agent` in CC/OpenCode, `delegate_task` in Hermes/Codex).

```
subagent(
  prompt="[content of modes/_shared.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="career-ops {mode}"
)
```

Execute the instructions from the loaded mode file.
