# Tasks — Simple/Advanced wizard modes

- [x] **R4** Extract pure `buildConfig(inputs, detected)` + `simpleDefaults(detected, basics)` into
      `src/commands/wizard.ts` (advanced assembly moved verbatim — no behavior change).
- [x] **R1** Setup-mode resolution in `init.ts` (`--advanced` | `--simple`/`--yes` | prompt, Simple default)
      + `--simple`/`--advanced` CLI flags.
- [x] **R2** Simple path: ask name + language + targets, show detected stack, apply documented defaults.
- [x] **R3** Advanced path: existing prompt sequence preserved; now feeds `buildConfig`.
- [x] Skill multiselect runs only in Advanced (Simple keeps the recommended set).
- [x] Tests `wizard.test.js`: `simpleDefaults` (detected vs empty), `buildConfig` Simple defaults +
      advanced-like input. Full suite green (61/61); advanced goldens unaffected.
- [ ] Verify + archive (next).
