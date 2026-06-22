# Proposal — Generated SDD-skill quality overhaul

Grounded in [`research.md`](research.md) (Spec-Kit, OpenSpec, Agent Skills best practices, context engineering,
per-agent). The generator preaches harness engineering but **emits** thin, duplicated, circular-triggered SDD
phase skills. Now that the foundations (F1–F3, `aiws` namespace + provenance + integrity) are in, the generated
skills can be made to honour the philosophy — born `aiws-*` with clean triggers.

## The concrete defects (today)
- **Circular trigger.** `sddSkill` frontmatter: *"Trigger: when planning/executing the X phase of an SDD change."*
  — says nothing about *when* in user-intent terms (Agent Skills §: description must be 3rd-person, what + when,
  key terms).
- **Thin body.** One sentence (`p.does`) + 4 generic bullets. No "right altitude" signals: no inputs, no output
  template, no quality bar.
- **Command ⟂ skill duplication.** `/aiws-sdd-X` repeats the same `p.does` — two artifacts, near-identical
  (violates "an agent can't pick between overlapping tools").
- **Phase data is too poor to fix this.** `Phase = { name, summary, does }`.

## Split (from research §8) — reviewable increments
- **0012a (this first) — rich phase data + SKILL-as-substance + command-as-pointer.** Extend the `Phase` model;
  emit a rich, self-contained SKILL.md per phase; invert the command to a thin launcher.
- **0012b — spec/delta format hardening.** OpenSpec deltas (ADDED/MODIFIED/REMOVED, `### Requirement:` /
  `#### Scenario:` GIVEN/WHEN/THEN, RFC 2119) + Spec-Kit `[NEEDS CLARIFICATION]` + Success Criteria in the
  generated `spec.md`/`sdd-spec`/`sdd-archive` + `_shared/sdd-convention.md`.
- **0012c — per-agent modernization.** Slim the Copilot mirror (Copilot reads `AGENTS.md` natively now);
  `clarify` consistency across blocks; optional read-only `/aiws-sdd-analyze`.
- **0012d — `lean` floor + eval rubric + regenerate `sdd-convention.md`** (stop `writeIfMissing`).

## F (0012a) — design

**Extend `Phase`** (`src/i18n/strings.ts`), English-only (AI-facing), optional fields so other consumers are
unaffected:
- `description` — intent-based, 3rd person, **what + when + key terms** (replaces the circular trigger).
- `reads` — the inputs to read first (prior change artifacts).
- `produces` — `{ file, sections[] }`: the output file + its **section template**.
- `quality` — a short **checklist** the artifact must pass before moving on.

**`sddSkill` → rich, self-contained SKILL.md** (`< 500` lines; phases are modest, so progressive-disclosure
`references/` is **not** needed here — that's reserved for large domains, matching "right altitude: don't
over-engineer"): frontmatter `description` = the intent text; body = purpose · **When to use** · **Read first**
(`reads`) · **Produce** (`produces.file` + section checklist) · **Quality bar** (`quality`) · the store/convention
note. Medium-freedom: a template + checklist, not a one-liner, not a rigid script.

**`commandFile` → thin launcher.** `description` = the intent; body = "Run the **`aiws-sdd-X`** skill." + the
store note. No `p.does` duplication — the skill is the single substance (fixes the overlap).

**`copilotPrompt`** stays **substantive** (Copilot has no skill to launch) but is derived from the same `Phase`
data (purpose + produce + quality), so it is no longer a thin near-duplicate either. (Full Copilot
AGENTS.md-native slimming is 0012c.)

## Decisions
- **`references/` for phase skills:** **no** (modest size; a rich self-contained SKILL.md is the right altitude).
  Progressive disclosure stays reserved for large domains (stack packs). Revisit if a phase body approaches 500 lines.
- **Scope of 0012a:** the orchestrator phases emitted by `generateSkills`/`generateSdd`. The REASONS/SPDD fusion
  packs (`aiws-sdd-*` skill-packs) are already rich, data-driven markdown — out of 0012a (touch in 0012b if needed).

## Risks / invariants
Byte baselines + skill-content tests regenerated deliberately; idempotency holds; `TEMPLATES_VERSION` bumped;
English-only for AI-facing content preserved.
