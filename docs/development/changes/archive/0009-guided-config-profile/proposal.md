# Proposal: Guided config — never silently infer the profile

## Intent

`init` guesses user type/experience from stack detection and is often wrong, skewing the whole governance
posture. Detection should seed the **stack only**; the **profile must be an explicit choice**. And the
AI-guided `/configure` path should drive a **complete, explained** configuration covering every option.

## Scope

### In Scope
- **Kill silent inference**: `simpleDefaults` no longer sets `userType`/`experience` from `detectedExisting`; Simple mode **asks** both (2 prompts, neutral defaults) — [wizard.ts:91-116](../../../../src/commands/wizard.ts), [init.ts](../../../../src/commands/init.ts).
- **Decouple Advanced profile defaults from detection** (stop keying `initialValue` off `detectedExisting` for userType) — [init.ts:136-155](../../../../src/commands/init.ts).
- **Enrich `configure-workspace`** (`CONFIGURE_SKILL_EN`) into an explained, table-like walkthrough of every option (targets · profile · mode · stack · sdd backend/methodology · safety guard · vscode · context7 · company · langs/frameworks/envs), each with a one-line rationale; rule: *ask the profile, don't guess* — [guides.ts:93-123](../../../../src/generate/guides.ts).
- Strengthen `init`'s closing nudge toward `/configure` as the richest path.

### Out of Scope
- Full interactive AI handoff from `init`.
- Config schema changes (shape stays identical → idempotency preserved).

## Approach

Small, surgical edits to `wizard.ts` + `init.ts` to make the profile explicit, plus a content expansion of the
generated `configure-workspace` skill. No config-shape change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/commands/wizard.ts` | Modified | `simpleDefaults` takes profile as input |
| `src/commands/init.ts` | Modified | Simple asks userType+experience; Advanced defaults neutral |
| `src/generate/guides.ts` | Modified | full explained guided-config walkthrough |
| `test/*` | Modified | update `simpleDefaults`/init fixtures |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| +2 prompts in Simple | Low | Keep to 2, neutral labels; eliminates wrong-profile bug |
| Skill text token budget | Med | Lean bullets/table; `doctor` lints budgets |
| Fixture churn | Med | Update tests; bump `TEMPLATES_VERSION` (skill content changed) |

## Rollback Plan

Revert the commit. Config shape unchanged, so existing `workspace.config.yaml` files keep working.

## Dependencies

- None (parallel to 0007/0008).

## Success Criteria

- [ ] No code path sets `userType`/`experience` without a user choice.
- [ ] Simple mode asks the profile; Advanced defaults don't key off detection.
- [ ] `configure-workspace` skill walks every option with a one-line rationale.
- [ ] `npm test` green; idempotency + doctor unaffected.
