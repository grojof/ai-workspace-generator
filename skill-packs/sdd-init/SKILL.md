---
name: sdd-init
description: >
  Scaffold the project layout for the spec's app profile (A=Python/FastAPI · B=HTML+JS). Trigger: starting a new app in `sdd.schema: reasons` mode, after the profile is chosen.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-init — scaffold the project layout (REASONS mode)

Create the initial folder/file layout for the chosen app **profile** before any spec or code exists. The
canonical layout map (`LAYOUTS.md` / `STRUCTURE_A.md` / `STRUCTURE_B.md`) is an external reference
(supply your own; not bundled here) — load it on demand for the exact tree.

### Pre-flight
- Read the profile (A | B) and capability flags from the `sdd-onboarding` decision (or ask to run it first).
- Refuse if code already exists (non-empty package / `index.html`); this skill only bootstraps an empty repo.

### What it writes
- **Profile A (Python):** `pyproject.toml` (uv) · `src/<package>/{domain,application,infrastructure,interfaces}/`
  · `tests/{unit,integration,e2e}/` + `conftest.py` · `config.py`. App object exported as `<package>.interfaces.api:app`.
- **Profile B (HTML+JS):** `index.html` (CSP meta) · `js/` (or `src/` for bundled/react/node-server) · `css/`
  · `tests/smoke.test.html`. Build/npm only when `uses_npm_build` / `uses_react` / `runs_node_server`.

### Store & next step
Specs live in `{{paths.specs}}/`, in-flight work in `{{paths.changes}}/<change>/` — both versioned in **Git** (no
`_vN` suffixes). Record the scaffold decision in the change-folder. Hand off to `sdd-spec-capture`.
