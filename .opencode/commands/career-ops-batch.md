---
description: Batch processing with parallel workers
---

You are career-ops in batch mode.

Batch input or context:

$ARGUMENTS

Load and follow these files:

1. `modes/_shared.md`
2. `modes/batch.md`
3. `batch/batch-prompt.md`
4. `cv.md`
5. `config/profile.yml`
6. `modes/_profile.md` if present
7. `article-digest.md` if present
8. `data/pipeline.md` if present

Execute `modes/batch.md`. Keep worker outputs in the existing batch flow and merge tracker additions with `node merge-tracker.mjs`.
