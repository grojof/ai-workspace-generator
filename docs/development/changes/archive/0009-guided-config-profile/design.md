# Design — Guided config: never silently infer the profile

## Overview

Make the governance profile (`userType`, `experience`) an explicit input in both wizard paths, and expand the
generated `configure-workspace` skill into a complete, explained walkthrough. No schema change.

## Changes

### 1. `SimpleBasics` carries the profile — `src/commands/wizard.ts`
- Add `userType: "business" | "technical"` and `experience: "beginner" | "standard" | "advanced"` to
  `SimpleBasics`.
- `simpleDefaults(detected, basics)`: replace the inferred
  `userType: detectedExisting ? "technical" : "business"` and hardcoded `experience: "standard"` with
  `basics.userType` / `basics.experience`.
- Keep `mode = detectedExisting ? "existing" : "new"` (project mode, not governance) and the
  `safetyGuard` derivation from `mode`.

### 2. Simple path asks the profile — `src/commands/init.ts`
- In the `else` (Simple) branch, after targets, add two `select` prompts:
  - **User type**: technical / business — neutral, no detection-based default (e.g. `initialValue` omitted or a
    fixed value); short hints as in Advanced.
  - **Experience**: beginner / standard / advanced — default `standard`.
- Pass them into `simpleDefaults(detected, { …, userType, experience })`.

### 3. Advanced default decoupled from detection — `src/commands/init.ts`
- Change the `userType` `select` `initialValue` from `detectedExisting ? "technical" : "business"` to a fixed
  neutral default; add a `note`/hint line clarifying that detection seeds the **stack**, not the profile.
- Leave the `mode` prompt's detection-based default as-is.

### 4. Enrich the guided skill — `src/generate/guides.ts`
- Expand `CONFIGURE_SKILL_EN`: add a concise, table/bullet **option walkthrough** (targets · profile · mode ·
  stack · sdd backend/methodology · safety guard · vscode · context7 · company · langs/frameworks/envs), each
  with a one-line rationale. Add an explicit rule: **ask the profile (userType×experience); never infer it
  from the detected stack.** Keep it lean (token budget; `doctor` lints).
- Optionally tighten the `init` closing nudge toward `/configure`.

### 5. Version + tests
- Bump `TEMPLATES_VERSION` in `src/version.ts` (generated skill text changed).
- Update `test/wizard.test.js`: the two inference tests become "pass-through" tests — `simpleDefaults` reflects
  the `basics` profile; `mode` inference still asserted. Add a case proving profile is independent of detection.
- Regenerate any golden fixture affected by the `configure-workspace` body change (`test/generate.test.js`).

## Why this approach
- Smallest change that removes the wrong-profile failure at its source (the inference), without touching the
  config schema → idempotency and existing configs are unaffected.
- Reuses the existing `configure-workspace` skill rather than adding a new surface (right altitude).

## Risks / mitigations
- **Fixture churn** from the skill text change → bump `TEMPLATES_VERSION`, regenerate goldens deliberately.
- **Token budget** for the enriched skill → keep it bullet/table form; verify with `ai-workspace doctor`.
- **+2 Simple prompts** → acceptable; they replace a silent wrong guess.
