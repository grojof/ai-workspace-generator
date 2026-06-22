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

## 0012b — spec/delta format hardening (next)
- [ ] OpenSpec deltas (ADDED/MODIFIED/REMOVED, `### Requirement:` / `#### Scenario:` GIVEN/WHEN/THEN, RFC 2119) +
      Spec-Kit `[NEEDS CLARIFICATION]` + Success Criteria in the generated `spec.md` template, the `aiws-sdd-spec`
      / `aiws-sdd-archive` skills, and `_shared/sdd-convention.md` (with the archive merge rules).

## 0012c — per-agent modernization
- [ ] Slim the Copilot mirror (`.github/copilot-instructions.md`) now that Copilot reads `AGENTS.md` natively;
      keep path-scoped `instructions/*` + prompts. `clarify` consistency across blocks. Optional read-only
      `/aiws-sdd-analyze` (cross-checks proposal/spec/design/tasks).

## 0012d — lean floor + eval rubric + convention regeneration
- [ ] A couple of substantive base references even without `reasons`; optional per-skill eval rubric; regenerate
      `_shared/sdd-convention.md` (stop `writeIfMissing`).
