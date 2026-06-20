# Spec — Prebuilt direct-download release (tarball on GitHub Releases)

Requirements use MUST/SHOULD. v1 artifact = `npm pack` tarball attached to a GitHub Release (a local artifact,
**not** an npm-registry publish).

## R1 — Single-source the CLI version
The CLI's reported version MUST come from one source; `src/cli.ts` MUST NOT hardcode a version literal.

- **Given** `CLI_VERSION` in `src/version.ts`, **when** `ai-workspace --version` runs, **then** it prints
  exactly `CLI_VERSION` (no separate hardcoded string in `cli.ts`).
- **Given** `package.json.version`, **then** a test asserts it equals `CLI_VERSION` (no drift between the
  artifact name and the reported version).

## R2 — Local release produces a tarball
A documented, repeatable local command MUST produce a complete, runnable tarball.

- **Given** a clean checkout, **when** the release command runs, **then** it builds (`tsc`) and runs `npm pack`,
  yielding `ai-workspace-generator-<version>.tgz` containing `dist/`, `templates/`, and `skill-packs/`.
- **Given** that tarball, **when** installed with `npm i -g <tgz>`, **then** `ai-workspace --version` prints the
  released version and `ai-workspace init`/`sync` work (templates resolve from disk as today).

## R3 — Publishing is an explicit, user-driven step (Safety gate)
Creating the GitHub Release MUST NOT happen automatically (no push/CI trigger that publishes); the release
command MUST default to **not** publishing.

- **Given** the release command with no publish flag, **when** it runs, **then** it builds + packs and **prints**
  the exact `gh release create …` command, but does **not** create a release.
- **Given** an explicit opt-in (flag), **then** it MAY run `gh release create` — only when the user asks.

## R4 — Docs cover easy + expert install and update
`README` (EN/ES) and `docs/project/USAGE` (EN/ES) MUST document both paths and how to update.

- **Given** the docs, **then** they show the **easy** path (`npm i -g <release-tgz-url>` / `npx <tgz>`) and the
  **expert/manual** path (clone → build → link), plus **update** (newer tarball / `git pull && build`).

## R5 — Wiki quickstart (ES) ready to apply
A ready-to-paste **Spanish** quickstart for the GitHub wiki MUST be produced (the wiki is a separate repo;
the user applies it).

- **Given** the change folder, **then** it contains `wiki-quickstart.es.md` with the easy tarball install +
  update, matching the docs.

## Out of scope
- True Node-less SEA binary (separate future change).
- npm-registry publish.
- Mandatory CI release automation (an optional workflow MAY be sketched in docs/design, not required).

## Acceptance summary
`ai-workspace --version` is single-sourced and matches `package.json`; a local command builds + packs a
runnable tarball; publishing is opt-in (Safety gate); README/USAGE (EN/ES) document easy + expert + update; a
Spanish wiki quickstart is ready to paste. Tests + doctor green; no runtime generation behavior changes.
