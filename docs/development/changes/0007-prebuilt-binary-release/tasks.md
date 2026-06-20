# Tasks — Prebuilt direct-download release (tarball on GitHub Releases)

## R1 — Single-source the version
- [x] `src/cli.ts`: import `CLI_VERSION`; `program.version(CLI_VERSION)` (dropped hardcoded literal).
- [x] `src/version.ts`: comment that `CLI_VERSION` MUST match `package.json.version`.
- [x] `test/version.test.js`: asserts `package.json.version === CLI_VERSION`.

## R2/R3 — Local release script (publish opt-in)
- [x] `scripts/release.mjs`: read version → build → `npm pack` → stable-named copy → default print `gh release create …`; `--publish` runs it.
- [x] `package.json`: `"release": "node scripts/release.mjs"`.

## R4 — Docs (easy + expert + update)
- [x] `README.md` Install: easy (tarball) + expert (clone/build) + update.
- [x] `README.es.md`: mirror.
- [x] `docs/project/USAGE.md` "Requirements & install": easy + expert + update + maintainer release note.
- [x] `docs/project/USAGE.es.md`: mirror.

## R5 — Wiki quickstart (ES)
- [x] `docs/development/changes/0007-prebuilt-binary-release/wiki-quickstart.es.md` ready to paste.

## Validation
- [x] `npm run build` + `npm test` green (75/75, incl. new version test).
- [x] `node scripts/release.mjs` (no flag) builds + packs (186 files) + prints the gh command, creates no release.
- [x] `ai-workspace --version` → 0.1.0 (single-sourced); tarball contains dist/templates/skill-packs.
- [x] `ai-workspace doctor` green.

## Verify (next)
- [x] `verify-report.md` written.
- [ ] `/doc-sync`; archive after merge. Cut real Release v0.1.0 = maintainer manual step.
