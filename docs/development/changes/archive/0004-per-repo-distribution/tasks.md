# Tasks — Per-repo distribution

- [x] **R1** `sourceRoots(cwd, config)` (root + `resolveRepos` children) + `collectEntries(roots, subdir)`
      (dedupe top-level by name, first-wins) in `src/commands/package.ts`.
- [x] **R2/R3** Replaced the three root-only `listFiles` projections with `projectTree(...)` over the
      collector for skills / commands / agents (deterministic, deduped).
- [x] **R4** Org zips + `INSTALL.md` skill ids built from the aggregated skill set (`_`-prefix + `SKILL.md`
      filter unchanged).
- [x] **R5** Test `package (0004)` in `test/generate.test.js` (aggregation + agents + org zips + INSTALL ids +
      idempotency); existing single-repo package tests green. **67/67**.
- [x] No `TEMPLATES_VERSION` bump (single-repo output unchanged; packaging is a deterministic projection).
- [x] doc-sync (PROJECT-STATE), spec folded into `specs/configuration.md`, verify-report, archived.
- [ ] Commit + PR.
