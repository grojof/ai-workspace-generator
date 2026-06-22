# Clarify: 0017 — AGENTS.md progressive disclosure

Decisions by the maintainer (2026-06-23). All four taken with the recommended option.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Canonical reference location | **Neutral `references/<area>/<id>.md`** + generated per-target projections | Target-agnostic single source; Copilot/Codex/Claude each get a projection, no duplication, no drift. |
| Q2 | `skill-routing` on Claude | **Keep always** | Skill-less targets (Copilot/Codex) need the routing table; revisit only if the spine is still heavy. |
| Q3 | This repo's manual contributor guide (~1858 tokens) | **Out of scope** (repo-only, not a generator feature) | 0017 is a product change; the guide is this repo's prose. Optional separate cleanup later. |
| Q4 | Codex nested `AGENTS.md` for stack rules | **Pointer-read first** | The AGENTS.md pointer + reference file is enough; add nested AGENTS.md only if proven needed. |

## Net scope

- **0017a (this slice):** stack detail (`lang-*`/`fw-*`/`env-*`) → `references/stack/<id>.md`; AGENTS.md keeps
  per-entry **pointer** content (block ids unchanged → no migration); Copilot `applyTo` projection where a file
  glob exists. Layer-0 stays inline.
- **0017b (next):** de-duplicate `sdd` / `harness-engineering` / `living-docs` against the skills.
