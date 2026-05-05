---
name: career-ops-update
description: "Use $career-ops-update to check for upstream Career-Ops system updates and apply or dismiss them. User data is never touched. Triggers: 'check for updates', 'update career-ops', 'is there a new version'."
---

# Career-Ops Update

Check for upstream system updates via `node update-system.mjs check`. Act only on `update-available`. User data (`cv.md`, `config/profile.yml`, `modes/_profile.md`, `data/*`, `reports/*`, `output/*`, `interview-prep/*`) is never touched.

## Steps

Run `node update-system.mjs check` and follow the script's status output. Ask before applying, dismissing, or rolling back an update.

See `AGENTS.md` for safety rules.
