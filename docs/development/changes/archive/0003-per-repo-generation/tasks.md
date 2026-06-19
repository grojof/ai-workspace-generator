# Tasks — Per-repo generation

- [x] **R1** Split `generate()` into `generateWorkspace(cwd, config, add)` (root canonical set, union stack)
      + a repo loop in `generate`; `AI-WORKSPACE.md` rendered last (`src/generate/index.ts`).
- [x] **R2** Derive `repoConfig = { ...config, stack: repo.stack }` per resolved repo; repo-level stack packs
      use it.
- [x] **R3** `agentsImportPath(repoPath)` helper (`.`→`AGENTS.md`, `a`→`../AGENTS.md`, `x/y`→`../../AGENTS.md`)
      + parametrized `CLAUDE.md.eta` import (`@<%= it.agentsImport || "AGENTS.md" %>`). Root gets a `CLAUDE.md`
      bridge (Claude reads CLAUDE.md, not AGENTS.md); children import `../AGENTS.md`; root carries no stack skills.
- [x] **R4** `generateStackPacks(cwd, config, scope)` scope split (`hasStackBinding`): non-stack → workspace,
      stack-bound → repo. Union-stack routing via `unionStack` in `src/config/schema.ts`, fed to
      `composeBlocks` (no `skillRouting.ts` change needed).
- [x] **R6** `doctor` repo-aware: per-child `CLAUDE.md` checks via `resolveRepos`; root `AGENTS.md`
      orphaned-block check over `unionStack(config)`.
- [x] **R5** Tests: `test/multi-repo.test.js` (two stacks, import path/depth, pack placement, union routing,
      idempotency) + `agentsImportPath`/`unionStack` units. Golden fixtures byte-identical (empty `repos[]`);
      66/66 green; second run 0/0 for single- and multi-repo.
- [x] Bumped `TEMPLATES_VERSION` 0.29.0 → 0.30.0 (`src/version.ts`).
- [ ] `/doc-sync` (living docs), verify (`/sdd-verify`), then archive (`/sdd-archive`) into
      `docs/development/specs/configuration.md`.
