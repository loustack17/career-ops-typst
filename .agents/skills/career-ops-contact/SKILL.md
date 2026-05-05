---
name: career-ops-contact
description: "Use $career-ops-contact to draft LinkedIn outreach to hiring managers, recruiters, or referrers for a target role. Triggers: 'draft outreach', 'LinkedIn message for X', 'how to reach the hiring manager'."
---

# Career-Ops Contact

Draft outreach (LinkedIn DMs, follow-up notes, referral asks) for a target company/role. Output is text the user can copy and send.

## Files to Load

- `modes/_shared.md`
- `modes/contacto.md`
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`

## Rules

- Draft only. Never send messages on the user's behalf.
- Anchor outreach to a concrete reason (recent product launch, mutual contact, specific JD line). Generic templates are rejected.
- Keep messages short. LinkedIn DMs cap around 250-300 chars; prefer brevity.
- Do not invent shared connections, projects, or events.

See `AGENTS.md` for safety rules.
