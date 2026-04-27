---
description: Scan job portals and discover new offers
---

Run the OpenCode agentic scan for new job offers.

Load and follow these files in order:

1. `modes/_shared.md`
2. `modes/scan.md`
3. `modes/scan-opencode.md`
4. `portals.yml`
5. `config/profile.yml`
6. `modes/_profile.md` if present
7. `data/scan-history.tsv` if present
8. `data/pipeline.md`
9. `data/applications.md`

Execute the full three-level scan defined in `modes/scan.md` using the OpenCode runtime mapping in `modes/scan-opencode.md`.

Do not replace the scan with `node scan.mjs` alone. Use `scan.mjs` only as the Level 2 ATS/API supplement.

If Level 3 WebSearch is blocked (403, permission denied, timeout, or empty results), you MUST attempt the fallback order defined in `modes/scan-opencode.md`. Do not silently skip Level 3. Record every fallback attempt in the final summary.

Use a frontier long-context tool-use model. Strongly prefer GPT-5.x-class, DeepSeek V4 Pro-class, or an equivalent frontier agent model with stable browser/search/tool-call behavior.

Additional filters or instructions:

$ARGUMENTS
