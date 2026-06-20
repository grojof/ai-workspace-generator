# Tasks — Guided config: never silently infer the profile

## R1 — Stop inferring the profile (`src/commands/wizard.ts`)
- [x] Add `userType` + `experience` to `SimpleBasics`.
- [x] `simpleDefaults`: use `basics.userType` / `basics.experience` (drop the `detectedExisting` profile guess and the hardcoded `experience`).
- [x] Keep `mode` + `safetyGuard` derivation from detection.

## R2/R3 — Simple path asks the profile (`src/commands/init.ts`)
- [x] Add a **user type** `select` (technical/business) — neutral default, no detection bias.
- [x] Add an **experience** `select` (beginner/standard/advanced) — default `standard`.
- [x] Pass both into `simpleDefaults(detected, { … })`.

## R2 — Advanced default decoupled (`src/commands/init.ts`)
- [x] Change `userType` `initialValue` off `detectedExisting`; fixed neutral default + clarifying `note` hint.

## R4 — Enrich guided skill (`src/generate/guides.ts`)
- [x] Expand `CONFIGURE_SKILL_EN` with an explained option walkthrough (one-line rationale each).
- [x] Add the rule: ask the profile (userType×experience), never infer from stack.
- [x] Tighten section 2 to call out "Profile is the user's choice — never infer it".

## R5 — Version + tests
- [x] Bump `TEMPLATES_VERSION` (`src/version.ts` → 0.33.0).
- [x] Update `test/wizard.test.js` (inference tests → pass-through; added detection-independence case).
- [x] No golden fixtures needed — `configure-workspace` body isn't snapshotted (only generation/routing is).
- [x] `npm run build` + `npm test` green (75/75); `ai-workspace doctor` green (AGENTS.md 5448/6000 tokens).

## Verify (next)
- [x] `verify-report.md`: R1–R5 acceptance scenarios confirmed against the built CLI.
- [ ] `/doc-sync`; then archive (fold deltas into `docs/development/specs/`). — pending user go-ahead + commit.
