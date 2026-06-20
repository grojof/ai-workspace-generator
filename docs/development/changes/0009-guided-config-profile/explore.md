# Exploration: 0009 — guided config + stop silent profile inference

> Status: exploration. No code touched.

## Goal

`ai-workspace init` "preconfigures user type + profile automatically and is sometimes wrong." Make the
AI-guided config the recommended path and ensure the **profile is always chosen, never silently inferred**;
give a **complete guided prompt** that walks every config option with the *why* of each.

## Current State

- **Silent inference (the bug).** Simple mode never asks the profile — `simpleDefaults` sets
  `userType: detectedExisting ? "technical" : "business"` and `experience: "standard"`
  ([src/commands/wizard.ts:91-116](../../../../src/commands/wizard.ts)). So a detected stack ⇒ "technical",
  empty ⇒ "business", with no user say — exactly the wrong-profile complaint.
- Advanced mode **does** ask userType/experience, but with `initialValue` nudges driven by detection
  ([src/commands/init.ts:136-155](../../../../src/commands/init.ts)). Detection should seed **stack only**, not governance posture.
- The **AI-guided path exists**: `configure-workspace` / `/configure` (`CONFIGURE_SKILL_EN` in
  [src/generate/guides.ts:93-123](../../../../src/generate/guides.ts)) — but it's `loadMode: "suggested"`, and
  its prompt doesn't enumerate every option with rationale, so the AI can under-explain choices.
- Profile drives governance posture via `templates/profile/posture.md.eta` — getting it wrong skews everything.

## Affected Areas

- `src/commands/wizard.ts` — `simpleDefaults`: stop inferring profile; require it as an input.
- `src/commands/init.ts` — Simple path: ask `userType` + `experience` (2 prompts, neutral defaults); decouple Advanced `initialValue`s from detection for profile.
- `src/generate/guides.ts` — enrich `CONFIGURE_SKILL_EN` into a full, explained option-by-option walkthrough (targets · profile · mode · stack · sdd backend/methodology · safety guard · vscode · context7 · company · languages/frameworks/envs), each with a one-line rationale; emphasize "ask the profile, don't guess".
- (Maybe) `init` end note: strengthen the nudge toward `/configure` as the richest path.

## Approaches

1. **Minimal** — Simple mode asks userType+experience instead of inferring. Fixes the bug, ~2 extra prompts.
   - Pros: smallest change, directly kills the wrong-profile issue. Cons: doesn't improve the AI-guided explainer.
   - Effort: Low.
2. **Recommended** — (1) + enrich `configure-workspace` into a complete guided prompt with the *why* of each
   option, and make `/configure` the clearly-recommended default path from `init`.
   - Pros: covers both asks (correct profile + full guided config with rationale); reuses existing skill.
   - Cons: more skill text (watch token budget).
   - Effort: Low-Medium.
3. **Full interactive AI handoff** from `init` — larger; out of scope.

## Recommendation

**Option 2.** Detection seeds **stack only**. Profile is always an explicit choice (Simple asks it; Advanced
stops keying its default off detection). Grow `CONFIGURE_SKILL_EN` into a concise, table-like walkthrough of
every option with a one-line rationale so the AI drives a complete, explained config — and have `init` point to
`/configure` as the richest path while remaining a valid manual fallback.

## Risks

- **More prompts in "simple"** — keep to exactly 2 (userType, experience) with neutral, clearly-labelled options; no silent wrong guess is the win.
- **Skill token budget** — keep the walkthrough lean (bullets/table), doctor lints budgets.
- **Config shape unchanged** → idempotency and existing tests unaffected; fixture/`init` tests for `simpleDefaults` will need updating.

## Ready for Proposal

**Yes.** Independent of 0007/0008 (can be implemented in parallel). Propose around Option 2.
