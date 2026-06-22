---
name: aiws-sdd-code-generation
description: >
  Generate application code from a user-reviewed REASONS spec — Profile A (layered FastAPI/SQLAlchemy) or B (ES modules + SRI CDN). Trigger: materialising a signed-off spec as code.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-code-generation — translate a spec into code (REASONS mode)

Read §2 Entities and §5 Operations, pick the matching pattern from a `GENERATION_PATTERNS.md`
reference (external; supply your own, load on demand), and write stubs into the right layer. **Deliberately mechanical: never invent
business logic** — an underspecified step becomes a marked `TODO(spec §5.x)` + `NotImplementedError`, not a guess.

### Pre-flight (stop on failure)
- Locate the active spec in `{{paths.specs}}/` (highest version per `spec_id`; ask if several).
- **Refuse `draft`/`retired`**; accept `user-reviewed`/`it-approved`. Re-validate against `aiws-sdd-spec-schema`.
- Read the prior generation record from the change-folder to compute incremental scope.

### Generate
- **Profile A** order (keeps imports valid): domain models → Pydantic schemas → repositories → external
  clients (each with an explicit `timeout`, SEC-NET-001) → use cases → interfaces (FastAPI routes / CLI) →
  config. DB-backed: add an Alembic migration per new entity.
- **Profile B:** one ES module per operation under the code root → wire `main.js` → add CDN `<script>`
  with pinned version + `integrity="sha384-…"` + `crossorigin`, append host to CSP `script-src`.
- Edit `pyproject.toml` / `index.html` to add **only** dependencies the generated code imports.

### Safety
Confirm the scope plan before writing. Never overwrite a hand-edited file (SHA mismatch vs the recorded
hash) without confirmation; removals are archived, never silently deleted. `py_compile` must pass.
Record the run (files + SHA-256 + TODOs) in `{{paths.changes}}/<change>/`. Hand off to `aiws-sdd-test-generation`.
