# Verify — Guided config: never silently infer the profile

Verified against the built CLI (`npm run build`) + full suite (`npm test`, 75/75) + `ai-workspace doctor`.

| Req | Scenario | Result |
|-----|----------|--------|
| R1 | Detection no longer sets `userType`/`experience`; they come from `basics` | ✅ `simpleDefaults` uses `basics.*`; new test "profile is independent of detection" passes (business/beginner on a detected stack, technical/advanced on empty) |
| R1 | Simple mode asks the profile | ✅ `init.ts` Simple branch adds user-type + experience `select` prompts before building inputs |
| R2 | Advanced user-type default not keyed off detection | ✅ `initialValue` changed `detectedExisting ? technical : business` → fixed `technical`; added a `note` clarifying detection seeds the stack only |
| R2 | `mode` may still default from detection | ✅ unchanged (mode prompt + `simpleDefaults` mode = existing/new from detection) |
| R3 | Simple adds ≤2 prompts | ✅ exactly 2 (user type, experience) |
| R4 | `/configure` skill explains every option + mandates asking the profile | ✅ `CONFIGURE_SKILL_EN` gains an "Option guide (with the why)" block and a "Profile is the user's choice — never infer it" rule |
| R5 | No config-shape change; idempotency preserved | ✅ schema untouched; idempotency invariant tests pass; doctor 0 errors/0 warnings; AGENTS.md 5448/6000 tokens |

## Notes
- `configure-workspace` body is not byte-snapshotted in fixtures (only generation + routing are asserted), so no golden regeneration was required.
- `TEMPLATES_VERSION` bumped 0.32.0 → 0.33.0 (generated skill text changed).
- Pre-existing behavior unchanged: `--yes`/`--simple` still run the Simple prompts interactively (now incl. the 2 profile prompts); a fully non-interactive `--yes` is a separate future improvement, out of scope here.

## Status
**Ready to commit.** Archive (fold deltas into `docs/development/specs/`) pending user go-ahead.
