---
name: aiws-sdd-onboarding
description: >
  Pick the app profile (A=Python / B=HTML+JS) via a plain-language decision tree and set the spec flags. Trigger: starting a new app in `sdd.schema: reasons` mode, or when the profile is undecided.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-onboarding — pick the app profile (REASONS mode)

Decide whether a new app is **Profile A** (Python backend: storage, auth, multi-user, secrets, schedules,
heavy compute) or **Profile B** (browser-only HTML+JS: a single page the user opens, no backend). Ask the
plain-language questions below in the user's language; map the answers to the profile + the spec frontmatter flags.

### Profile — ask Q1–Q6 in order; the first YES ⇒ Profile A; all NO ⇒ Profile B
- Q1 Persistent storage — remember data after the app is closed?
- Q2 Authentication — users log in / need to know who did what?
- Q3 Scheduled tasks — run automatically on a schedule?
- Q4 External service needing a secret — connect to a DB/API/service that needs a password/key/token? (B can't hide secrets)
- Q5 Multi-user shared data — several people see/change the same data?
- Q6 Heavy compute / large data — slow or memory-heavy work, or more than a few MB at once?

### Flags (always asked; do not change the profile)
- Q7 Personal data → `handles_personal_data` (true ⇒ §7.2 GDPR/LOPDGDD mandatory)
- Q8 External API → `requires_external_api` (true ⇒ every call listed in §5 with an explicit timeout)
- Q2 = YES implies `requires_authentication: true`.

### Profile-B-only flags (N/A in A)
- Q9 Non-personal browser preferences → `uses_localstorage`
- Q10 Rich UI needing React → `uses_react` (suggests Q11 = YES)
- Q11 Comfortable with Node.js + npm + build → `uses_npm_build`
- Q12 Node.js server in production → `runs_node_server` (requires `uses_npm_build: true`)

### Profile-A-only flag (N/A in B)
- Q13 Server-rendered UI vs API-only → `serves_html_ui` (A-with-UI vs A-api-only)

### UI flag (UI projects only, default YES)
- Q14 Corporate look & feel → `apply_branding` (uses a brand skill if you ship one; falls back to neutral)

### Tech stack per profile (summary; full rules load on demand)
- **A (Python)**: Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.x (SQLite dev / PostgreSQL prod) · uv · pytest.
- **B (HTML+JS)**: browser ES modules + CDN/SRI; optional Alpine.js (CSP build), React (+ npm/Vite), or a Node server (Fastify).

### Record the choice
- Set `sdd.appProfile` (A | B) in `workspace.config.yaml`, then run `ai-workspace sync`.
- Write the flags into the spec's frontmatter (see the `aiws-sdd-spec-schema` skill).

### Promotion rule
If a Profile-B app later needs anything from Q1–Q6, it must be **promoted to A** — a structural rewrite,
not a version bump. Re-run onboarding to confirm.
