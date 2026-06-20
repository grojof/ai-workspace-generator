# Tasks — Greenfield technology-selection directive (idempotent)

## R1 — New block template
- [x] `templates/core/tech-selection.md.eta`: clarify constraints → production target → 2-3 coherent options (pros/cons/risk) → recommend → await decision (Safety gate) → record in PROJECT-STATE.md + `ai-workspace add`; context7 for versions; terse-offer reminder.

## R2 — Register + gate
- [x] `src/generate/blockManifest.ts`: added `tech-selection` between `skill-routing` and the language `expand`, gated `mode === "new" && no languages && no frameworks`.

## R3 — Living-docs decision record
- [x] `templates/living-docs/section.md.eta`: PROJECT-STATE.md bullet includes "stack & production-target decision (what + why)".

## R4 — Terse-offer convention
- [x] `templates/core/conventions.md.eta`: bullet under Token efficiency ("say X and I'll explain X").

## R5 — Version + tests
- [x] `src/version.ts`: bumped `TEMPLATES_VERSION` → 0.34.0.
- [x] `test/invariants.test.js`: added gating test (greenfield empty-stack present after skill-routing; existing absent; new+stack absent). Order/prefix goldens unchanged.
- [x] Regenerated `test/__fixtures__/agents/*.md` baselines (block-manifest byte-identical test).

## Validation
- [x] `npm run build` + `npm test` green (75/75; idempotency + prefix + order + byte-baseline intact).
- [x] `ai-workspace doctor` green. This repo is `existing` → block absent; did NOT resync the repo's own AGENTS.md (a full sync pulls in *pre-existing* drift — the `configure-workspace` skill-routing row + uncommitted generated files — unrelated to 0010).

## Verify (next)
- [x] `verify-report.md` written.
- [ ] Archive after merge.
