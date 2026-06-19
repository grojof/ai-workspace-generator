# Tasks — Multi-repo polish

- [x] **R1** Per-repo Copilot `applyTo` instructions in `generateWorkspace` (`repoInstruction`/`repoSlug`);
      single-repo emits none.
- [x] **R2a** `ModuleEntry.vscodeExtensions?`/`vscodeFormatter?` in `registry.ts`; populated ts/js/go/python.
- [x] **R2b** `guides.ts` `extensionsJson`/`settingsJson` derive from the registry via `stackModules`;
      `generateVscode` uses the union stack.
- [x] **R2c** `doctor` validates stack ids vs registry (`find`, over `unionStack`); `add`/`remove` CLI help
      lists `environment`.
- [x] **R3** `DistributionSchema.perRepo` (default false); `repoPluginName`/`repoPluginManifest`/
      `marketplaceManifestMulti` in `packaging.ts`; `package.ts` per-repo branch vs umbrella default; org zips +
      INSTALL from the full aggregate.
- [x] **Tests**: R1 + R2 (`.vscode` + doctor) + R3 in `multi-repo.test.js`/`generate.test.js`; **71/71**.
- [x] Bumped `TEMPLATES_VERSION` 0.30.0 → 0.31.0.
- [x] doc-sync (PROJECT-STATE), spec folded into `specs/configuration.md`, verify-report, archived.
- [ ] Commit + PR.