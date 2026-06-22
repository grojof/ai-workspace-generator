---
name: aiws-sdd-audit-stack
description: >
  Audit the tech stack against the profile's catalogue (TECH-A-* / TECH-B-*). Trigger: stack review.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-audit-stack — tech-stack audit (TECH-A-* / TECH-B-*)

Verify the technology choices conform to the spec's `profile`. Cite findings by control ID. The full
`TECH_STACK_A.md` / `TECH_STACK_B.md` catalogues are an external reference (supply your own; not bundled
here) — load the one for the active profile.

### Profile A (Python) — TECH-A-*
- Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.x (SQLite dev / PostgreSQL prod) · uv · pytest.
- Server-rendered UI uses HTMX + Jinja2 by default (TECH-A-004); Vue 3 only with §3.2 justification.

### Profile B (HTML+JS) — TECH-B-*
- Browser ES modules + CDN with SRI; default reactivity Alpine.js CSP build.
- Optional: `uses_localstorage` (TECH-B-016), `uses_react` (TECH-B-017), `uses_npm_build` (TECH-B-018),
  `runs_node_server` (TECH-B-019/020, Fastify default, PM2). Each flag must match the spec frontmatter.

### Output
A report confirming each dependency/version against the catalogue, flagging anything outside the profile.
