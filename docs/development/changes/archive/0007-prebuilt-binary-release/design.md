# Design — Prebuilt direct-download release (tarball on GitHub Releases)

## Overview

Make the released artifact a `npm pack` tarball attached to a GitHub Release, generated locally, with the CLI
version single-sourced. No generator runtime changes — `npm pack` already ships `dist/ + templates/ +
skill-packs/` (the `files` field), so on-disk asset resolution is unchanged.

## Changes

### 1. Single-source the version — `src/cli.ts`, `src/version.ts`, test
- `src/cli.ts`: `import { CLI_VERSION } from "./version.js"` and `program.version(CLI_VERSION)` (drop the
  hardcoded `"0.1.0"`).
- `src/version.ts`: `CLI_VERSION` stays the canonical literal; add a one-line comment that it MUST match
  `package.json.version`.
- New `test/version.test.js`: read `package.json` and assert `version === CLI_VERSION` (guards drift).

### 2. Local release script — `scripts/release.mjs` + `package.json`
- New `scripts/release.mjs` (Node, ESM):
  1. read `version` from `package.json`;
  2. run `npm run build` then `npm pack` (capture the produced `.tgz` name);
  3. **default**: print the exact `gh release create v<version> <tgz> --title … --notes …` command and stop
     (Safety gate — no publish);
  4. `--publish` flag: actually spawn `gh release create …` (only when asked).
- `package.json` scripts: `"release": "node scripts/release.mjs"` (and document `--publish`).

### 3. Docs — README(.es), USAGE(.es)
- Add an **"Install"** structure with two paths:
  - **Easy (recommended):** `npm i -g https://github.com/grojof/ai-workspace-generator/releases/latest/download/ai-workspace-generator-<version>.tgz` (or `npx <tgz-url> init`). Note: needs Node ≥ 20 (change 0008 will auto-install it).
  - **Expert / from source:** the existing clone → `npm install && npm run build && npm link`.
  - **Update:** re-install the newer tarball / `git pull && npm run build`.
- Keep EN canonical; mirror into the ES files.

### 4. Wiki quickstart (ES) — change folder
- `docs/development/changes/0007-prebuilt-binary-release/wiki-quickstart.es.md`: ready-to-paste Spanish
  quickstart (easy tarball install + update), for the user to paste into the separate `*.wiki` repo.

### 5. (Optional, documented not built) `release.yml`
- Sketch a tag-triggered workflow in the design only; not added in v1 (local flow is the requirement).

## Why this approach
- Zero asset refactor (filesystem resolution unchanged) → lowest risk, matches "build locally + upload".
- Publishing stays a deliberate human action (Safety gate); CI is not required.

## Risks / mitigations
- **Version drift** → `test/version.test.js` pins `package.json` ↔ `CLI_VERSION`.
- **"Binary" expectation** → docs state the tarball needs Node; SEA binary tracked separately.
- **Accidental publish** → release script does not publish unless `--publish` is passed.
- **Latest-download URL shape** → use GitHub's `releases/latest/download/<asset>` convention; document the
  exact asset name pattern.
