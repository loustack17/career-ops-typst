# Career-Ops Hermes -- Superpowers Mapping

This document maps Hermes Superpowers skills to Career-Ops workflows, ensuring Claude Code-equivalent discipline for complex tasks.

## Skill Mapping

| Hermes Superpowers skill | Use in Career-Ops |
|---|---|
| `writing-plans` | Use before multi-file Hermes adapter changes, migration plans, and risky scan changes. |
| `subagent-driven-development` | Use for scan source splitting, batch processing, resolver verification, and independent implementation work. |
| `systematic-debugging` | Use for blocked portals, search failures, liveness false positives, resolver failures, PDF/layout regressions, and tracker merge issues. |
| `test-driven-development` | Use for resolver scripts, liveness logic, parser changes, and reusable automation code. |
| `requesting-code-review` | Use before finalizing Hermes adapter changes or any change affecting scan/pipeline/apply behavior. |

## When to Use Superpowers

### Required

Use the relevant Superpowers skill when the task involves:

- **Scan coverage changes** -- any change to how Level 1, Level 2, or Level 3 scanning works
- **Pipeline integrity** -- changes to tracker merge, dedup, or status normalization logic
- **Resolver behavior** -- changes to LinkedIn/Indeed resolver scripts or how URLs are processed
- **Application flow** -- changes to how applications are evaluated, scored, or tracked
- **PDF generation** -- changes to Typst templates, PDF generation scripts, or output formatting
- **Multi-file adapter changes** -- changes that touch more than one Hermes adapter file simultaneously
- **Migration work** -- updating `HERMES.md`, `SKILL.md`, or `scan-hermes.md` to match upstream `CLAUDE.md` changes

### Not Required

Superpowers are overkill for:

- Simple tracker reads (`/career-ops tracker`)
- One-off comparisons (`/career-ops compare`)
- Small documentation edits (fixing a typo in a mode file)
- Running a single evaluation (`/career-ops evaluate`)
- Running a single scan without code changes (`/career-ops scan`)

## Rules

1. **Superpowers are workflow discipline, not Career-Ops logic.** They guide how to approach a task, not what the task should produce. They must NOT create alternate scoring, tracker, PDF, or scan implementations.

2. **If a Superpowers skill is unavailable**, continue with the equivalent workflow manually and report that the skill was unavailable. For example:
   - If `writing-plans` is unavailable, write the plan in a markdown file before proceeding.
   - If `subagent-driven-development` is unavailable, structure the work into independent tasks and execute them sequentially.
   - If `systematic-debugging` is unavailable, follow the 4-phase root-cause debugging process manually.
   - If `test-driven-development` is unavailable, write tests before implementation code.
   - If `requesting-code-review` is unavailable, self-review the diff before committing.

3. **Do not require Superpowers for simple tasks.** A single tracker read or one-off evaluation does not need a planning or debugging discipline. Reserve Superpowers for tasks where the discipline prevents real mistakes.

4. **Do not substitute Superpowers for domain knowledge.** A plan written with `writing-plans` still needs to follow the scan strategy in `modes/scan.md` and `modes/scan-hermes.md`. Code reviewed with `requesting-code-review` still needs to follow the pipeline integrity rules in `HERMES.md`.