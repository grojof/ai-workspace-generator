---
name: aiws-sdd-reverse-engineering
description: >
  Recover a draft REASONS spec from an existing codebase that arrived without one (or whose spec drifted). Trigger: auditing code that lacks a current spec (reviewer/IT side).
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-reverse-engineering — recover a spec from code (reviewer side)

When a project arrives **without a spec** (or its spec drifted), reconstruct a draft REASONS spec from the
code so the `sdd-audit-*` skills have something to audit against. Reviewer/IT use; advanced.

### How
- Detect the profile from the layout (Profile A: `pyproject.toml` + layered `src/`; Profile B: `index.html` + `js/`).
- **Profile A:** scan FastAPI routes, SQLAlchemy models, Pydantic schemas and use-cases to recover §2 Entities
  and §5 Operations. **Profile B:** scan `index.html` + JS modules for the operations and UI surfaces.
- Write a **versioned draft** spec to `{{paths.specs}}/<NNN>-<slug>.md` with `status: draft`, a clear
  "reverse-engineered" banner, and `TODO` markers for sections the code can't reveal (business rationale,
  acceptance criteria, data-protection basis).

### Hand-off
The draft must be **confirmed by a human** (sign-off → `user-reviewed`) before the audits run — the audits
refuse drafts. Record the recovery in `{{paths.changes}}/<change>/`.
