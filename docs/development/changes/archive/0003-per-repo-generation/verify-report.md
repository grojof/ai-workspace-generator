# Verify report — Per-repo generation

Verified the implementation against `spec.md` (R1–R6). Status: **PASS**. `npm run build` clean; `npm test`
**66/66** (61 pre-existing + 5 new).

| Req | Verdict | Evidence |
|-----|---------|----------|
| **R1** Workspace vs repo split | ✅ | `generate()` calls `generateWorkspace()` (root canonical set) then loops `resolveRepos()`; `AI-WORKSPACE.md` rendered last (`src/generate/index.ts`). |
| **R2** Effective stack per repo | ✅ | `repoConfig = { ...config, stack: repo.stack }`; odoo packs land under `app-a/`, react packs under `app-b/` (`multi-repo.test.js`). |
| **R3** Canonical source at root | ✅ | Child `CLAUDE.md` imports `@../AGENTS.md`; no child `AGENTS.md`; root keeps the `@AGENTS.md` bridge, no stack skills (`multi-repo.test.js`). |
| **R4** Workspace vs stack-bound packs | ✅ | `generateStackPacks(scope)` + `hasStackBinding`: `mcp-builder` (non-stack) at root only; stack packs per child. Union routing in root `AGENTS.md` lists both `odoo-18.0` + `frontend-ui-dark-ts`. |
| **R5** Backward compat (single-repo) | ✅ | AGENTS.md goldens byte-identical (`block-manifest.test.js`); idempotency 0/0 single- + multi-repo (`generate.test.js`, `multi-repo.test.js`, `invariants.test.js`). |
| **R6** Doctor multi-repo aware | ✅ | Per-child `CLAUDE.md` checks via `resolveRepos`; orphaned-block check over `unionStack`. Smoke-tested on a 2-repo workspace: 0 errors, no orphaned blocks, no missing-adapter warnings. |

## Design refinements during apply (tool-mechanics facts, verified vs Claude Code docs)
1. **Root needs a `CLAUDE.md`.** Claude Code reads `CLAUDE.md`, not `AGENTS.md`; the root therefore keeps a
   `CLAUDE.md` bridge (`@AGENTS.md`). It carries no stack skills, preserving the "root = coordinator" intent.
2. **Copilot is workspace-level.** Copilot reads one workspace-root `.github/copilot-instructions.md` (no
   nested discovery), and MCP/settings are project-root scoped, so those stay at the root (union stack). The
   per-repo win is on the Claude target (nested `CLAUDE.md` + `.claude/skills/`), which Claude Code discovers
   natively. Spec R1/R3 + design updated accordingly.

## Notes / accepted deltas
- `AI-WORKSPACE.md`'s artifact index may list stack packs in a new order vs the previous generator (files on
  disk are byte-identical). `TEMPLATES_VERSION` bumped 0.29.0 → 0.30.0.
- A multi-stack workspace's root `AGENTS.md` can exceed the 4000-token budget (union of all Layer-1 blocks) →
  soft `doctor` warning, expected.
- Child `CLAUDE.md` importing `@../AGENTS.md` is an external import (one-time Claude Code approval) and assumes
  the **workspace** model (open the root). Documented; not a standalone-clone setup.
