# Proposal: Prebuilt direct-download release (tarball on GitHub Releases)

## Intent

Today the only way to get the CLI is to clone + `npm run build`. The AI (or any user) needs a **direct
artifact for the latest version** without an npm-registry account. A `npm pack` tarball is a *local* artifact
(not a registry publish), so it satisfies "no npm bureaucracy", "regenerate locally", and "download directly".

## Scope

### In Scope
- A local **release script** (npm script) that runs `npm pack` and `gh release create v<version> <tgz>`.
- **Single-source the CLI version**: `src/cli.ts` imports `CLI_VERSION` from `src/version.ts` (stop hardcoding `"0.1.0"`); keep `version.ts` ↔ `package.json` in sync (documented invariant or a check).
- **Docs**: install + update sections in `docs/project/USAGE.md` (+ `USAGE.es.md`), `README.md` (+ `README.es.md`) — easy path (`npm i -g <tgz-url>` / `npx <tgz>`) + expert/manual (clone + build).
- **GitHub wiki quickstart (ES)** updated for tarball install (separate `*.wiki` repo; provide ready-to-paste ES content, applied by the user).

### Out of Scope
- True Node-less binary (Node SEA) — deferred to a future change (asset re-architecture + per-OS signing).
- Publishing to the npm registry.
- Mandatory CI release automation (an optional tag-triggered `release.yml` may be sketched, not required).

## Approach

Reuse the existing `files: [dist,templates,skill-packs]` — `npm pack` already produces a complete, runnable
artifact (filesystem asset resolution unchanged). Release = build → pack → `gh release create`. Local-first,
no secrets/CI needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | add `release`/`pack` script |
| `src/cli.ts`, `src/version.ts` | Modified | single-source `--version` |
| `docs/project/USAGE*.md`, `README*.md` | Modified | install/update docs |
| GitHub wiki (ES) | Modified (by user) | quickstart |
| `.github/workflows/release.yml` | New (optional) | tag-triggered attach |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Users expect Node-less .exe | Med | Docs state "needs Node"; 0008 auto-installs it; SEA tracked separately |
| Version drift mislabels artifact | Med | Single-source version + sync check |
| Accidental outward publish | Low | Release is a manual, user-run step (Safety gate); no push-triggered publish |

## Rollback Plan

Revert the commit (script + doc + version edits); delete the GitHub Release/tag if created. No runtime code
paths change, so reverting cannot break `init`/`sync`.

## Dependencies

- `gh` CLI authenticated for the release step (user-side).
- Sequence: **0008 (guided-install)** depends on this artifact existing.

## Success Criteria

- [ ] `npm run release:local` produces a `.tgz` and (after approval) a GitHub Release with it attached.
- [ ] `npm i -g <release-tgz-url>` then `ai-workspace --version` prints the released version (no drift).
- [ ] USAGE/README + wiki quickstart document easy + expert install and update.
- [ ] Idempotency/doctor unaffected; `npm test` green.
