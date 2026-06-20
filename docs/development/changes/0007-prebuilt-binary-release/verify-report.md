# Verify — Prebuilt direct-download release (tarball on GitHub Releases)

Verified against the built CLI + `npm test` (75/75) + a dry-run of `scripts/release.mjs` + `doctor`.

| Req | Scenario | Result |
|-----|----------|--------|
| R1 | `--version` single-sourced, no hardcoded literal | ✅ `cli.ts` imports `CLI_VERSION`; `ai-workspace --version` → `0.1.0` |
| R1 | `package.json.version === CLI_VERSION` | ✅ new `test/version.test.js` passes (guards drift) |
| R2 | Local command builds + packs a complete tarball | ✅ `node scripts/release.mjs` → `ai-workspace-generator-0.1.0.tgz` (186 files, 1.2 MB unpacked) incl. `dist/ + templates/ + skill-packs/`; stable copy `ai-workspace-generator.tgz` created |
| R3 | No publish by default (Safety gate) | ✅ dry-run prints the exact `gh release create v0.1.0 …` command and exits without creating a release; `--publish` is required to publish |
| R4 | Docs cover easy + expert + update | ✅ `README.md`/`README.es.md` and `docs/project/USAGE.md`/`USAGE.es.md` show tarball install, from-source, and update |
| R5 | Spanish wiki quickstart ready to paste | ✅ `wiki-quickstart.es.md` in the change folder (easy install + update + AI-guided fallback) |
| — | Idempotency / token budget unaffected | ✅ no template changes; `doctor` 0 errors / 0 warnings (AGENTS.md 5448/6000) |

## Notes
- The latest-download URL uses GitHub's `releases/latest/download/<asset>` with a **stable** asset name
  (`ai-workspace-generator.tgz`) so the install command never needs the version number.
- Tarballs are git-ignored (`*.tgz`), so the dry-run leaves the working tree clean.
- **Publishing the actual Release is the maintainer's manual step** (`gh release create …` or
  `node scripts/release.mjs --publish`) — intentionally outside this change (Safety gate). `gh` must be authed.
- The Spanish wiki content must be pasted by the user into the separate `*.wiki` repo.

## Status
**Ready to commit.** Cutting the first real Release (v0.1.0) is a follow-up manual action by the maintainer.
