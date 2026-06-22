# Tasks — Generated SDD-skill quality overhaul (0012)

## 0012a — rich phase data + SKILL-as-substance + command-as-pointer (done)
- [x] Extended the `Phase` model (`src/i18n/strings.ts`) with optional AI-facing fields: `description`
      (intent-based, 3rd-person what+when), `reads`, `produces` ({file, sections}), `quality`. Populated all 10
      English phases (constitution → archive). ES list unchanged (English-only AI-facing content).
- [x] `sddSkill` (`src/generate/skills.ts`) now emits a rich, self-contained SKILL.md: intent description (no
      circular trigger) + **Read first** + **Produce** (section template) + **Quality bar** (checklist) +
      How-to-work + store note. < 500 lines (no `references/` needed for modest phase skills).
- [x] `commandFile` (`src/generate/sdd.ts`) → thin launcher ("Run the **`aiws-sdd-X`** skill …"), no duplicated
      substance (fixes the command⟂skill overlap). `copilotPrompt` stays substantive (Copilot has no skill to
      launch) but derives from the same phase data (produce + quality), not a thin duplicate.
- [x] `test/sdd-skill-quality.test.js` (3): rich intent-based skill + template + quality bar (no circular
      trigger); thin command; substantive copilot prompt. `TEMPLATES_VERSION` → 0.41.0. 97/97 green.

## 0012b — spec/delta format hardening (done)
- [x] `aiws-sdd-spec` produce template + quality now use the OpenSpec **delta** format: `## ADDED/MODIFIED/REMOVED
      Requirements`, `### Requirement:` (RFC 2119), `#### Scenario:` GIVEN/WHEN/THEN, inline `[NEEDS CLARIFICATION]`,
      measurable Success Criteria. (`aiws-sdd-archive` already carries the ADDED→append / MODIFIED→replace /
      REMOVED→delete merge rules from 0012a.)
- [x] `_shared/sdd-convention.md` documents the delta format + the archive merge rules. (Still `writeIfMissing`;
      0012d makes it regenerated so existing repos get the update.)
- [x] `test/sdd-skill-quality.test.js` extended (delta headers / Requirement / Scenario / NEEDS CLARIFICATION in
      the skill; convention documents format + merge rules). `TEMPLATES_VERSION` → 0.42.0. 98/98 green.

## 0012c — per-agent modernization (done)
- [x] **Slimmed the Copilot mirror** to a thin pointer: `.github/copilot-instructions.md` is now one block that
      points to `AGENTS.md` (Copilot reads it natively → a full mirror double-loaded). The additive surface —
      path-scoped `instructions/*.instructions.md` (`applyTo`) + `prompts/*` — is kept.
- [x] **`clarify` consistency:** added `/aiws-sdd-clarify` to the SDD flow in the `workflow` block, and
      `clarify.md` to the `_shared/sdd-convention.md` store layout.
- [x] Tests (`generate.test.js`): thin-pointer mirror (1 block, points to AGENTS.md, no governance blocks,
      instructions kept) + clarify in the flow. Byte baselines regenerated. `TEMPLATES_VERSION` → 0.43.0. USAGE
      updated. 100/100 green.
- [ ] **Deferred:** optional read-only `/aiws-sdd-analyze` (a new phase changes the orchestrator block + byte
      fixtures; small follow-up, low urgency) — left as a note, not blocking.

## 0012d — lean floor + eval rubric + convention regeneration
- [ ] A couple of substantive base references even without `reasons`; optional per-skill eval rubric; regenerate
      `_shared/sdd-convention.md` (stop `writeIfMissing`).
