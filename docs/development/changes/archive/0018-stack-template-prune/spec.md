# Spec — 0018 · Engineering-practices baseline (replace per-stack prose)

Requirements use RFC 2119 keywords (MUST / SHOULD / MAY). This is a **delta** against current generation
(the 0017a two-tier per-stack rendering) and the `specs/configuration.md` baseline. Settles `clarify.md`
Q1–Q4. Describes WHAT must be true; the HOW is `design.md`.

## ADDED Requirements

### Requirement: Engineering-practices baseline reference
The generator MUST emit a single, rich, **language-agnostic** `references/engineering-practices.md`
("rules with teeth") covering, as generic patterns: change discipline (small, reversible, one logical change);
data & migrations (schema changes reviewed and reversible); secrets & supply chain (never bake secrets into
images/artifacts; justify and verify dependencies); input validation at boundaries; explicit error handling
(no silent catches); testing (test behavior, not implementation; a failing test pins a bug first);
observability (no leftover debug logging); and performance (measure before optimizing). It MUST be reached by a
**lean pointer block** from the AGENTS.md hub (the 0017 progressive-disclosure pattern) and MUST NOT restate
the AGENTS.md Layer-0 *Universal conventions* — no rule appears in both the hub and the reference.

#### Scenario: Baseline is generated and pointed to
- GIVEN any valid config WHEN `generate`/`sync` runs THEN `references/engineering-practices.md` exists with the
  full baseline AND the AGENTS.md hub contains a lean pointer block linking to it AND a second run reports the
  reference `unchanged` (idempotent).

#### Scenario: No Layer-0 duplication
- GIVEN the generated AGENTS.md and `references/engineering-practices.md` WHEN compared THEN no Layer-0
  *Universal conventions* rule (Code style, Reviews & safety) is restated verbatim in the reference; the hub
  keeps the one-paragraph stance + pointer, the reference carries the depth.

### Requirement: Skill packs are the documented path for stack/domain specifics
The documentation MUST state that stack- and project-specific rules now live in **skill packs / skill groups**
(ours or a company's, e.g. an Odoo group) selected explicitly, and that this is the designed extension path —
not a coverage gap. This MUST appear in `docs/project/EXTENDING.md` and `docs/development/status/PROJECT-STATE.md`.

#### Scenario: The extension path is documented
- GIVEN `EXTENDING.md` and `PROJECT-STATE.md` after this change WHEN read THEN both describe skill packs/groups
  as the intended home for stack/domain specifics, replacing the removed per-stack prose.

### Requirement: Non-destructive migration of removed reference files
Removing the per-stack body output MUST be **non-destructive** to existing user repos: `sync`/`generate` MUST
NOT delete previously generated `references/stack/<id>.md` or `.github/instructions/<id>.instructions.md`
files. The migration (these files are now orphaned and may be removed by the user) MUST be documented in
`docs/project/MAINTAINING.md` and in this change folder. `doctor` MAY surface a non-blocking advisory for a
leftover `references/stack/*.md` that has no managed pointer.

#### Scenario: sync never deletes user-side files
- GIVEN a repo that still contains 0017-era `references/stack/typescript.md` WHEN `sync` runs under this change
  THEN that file is left untouched (not deleted, not rewritten) AND the migration note explains it is now safe
  to remove.

## MODIFIED Requirements

### Requirement: Per-stack AGENTS.md block content (Previously: a pointer to `references/stack/<id>.md`)
Each active stack entry's `lang-*` / `fw-*` / `env-*` managed block MUST keep its **id and heading**, but its
content MUST become a **single inline context7 pointer line** instead of a link to a body file — e.g.
`> Query **context7** for `typescript@5.x` best practices.` (environments without a version drop the `@ver`).
No per-stack rule prose is emitted in AGENTS.md.

#### Scenario: Block is an inline context7 pointer
- GIVEN a config with `typescript` WHEN generated THEN the `lang-typescript` block contains its heading + one
  context7 pointer line AND contains no link to `references/stack/typescript.md` AND `doctor`'s dangling-
  reference check reports no broken pointer (nothing to resolve).

#### Scenario: Block ids stay stable
- GIVEN the block-order golden WHEN regenerated THEN the `lang-*/fw-*/env-*` ids are unchanged (no migration);
  only their content (and the deliberate byte fixtures) change.

## REMOVED Requirements

### Requirement: Per-stack prose templates and generated bodies (Reason: relocated to the evergreen baseline + skill packs)
The 12 `templates/{languages,frameworks,environments}/*/layer.md.eta` templates, the `stackBody` render path,
and the generated `references/stack/<id>.md` body files MUST be removed. The generator MUST NOT emit per-stack
rule bodies.

#### Scenario: No per-stack body is produced
- GIVEN any config WHEN generated THEN no `references/stack/<id>.md` rule body is written AND none of the 12
  `layer.md.eta` templates remain in the tree.

### Requirement: Copilot per-stack instruction projection (Reason: carried the same removed prose)
The per-stack `.github/instructions/<id>.instructions.md` projection (driven by `stackBody`) MUST no longer be
emitted. (The per-**repo** `applyTo` instruction from change 0005 is unrelated and unchanged.)

#### Scenario: No per-stack Copilot instruction file
- GIVEN `typescript` + `copilot` target WHEN generated THEN no `.github/instructions/typescript.instructions.md`
  is emitted by the stack path.

## Out of scope
- **Wizard simplification** (`init.ts`/`wizard.ts`) — deferred to a follow-up (clarify Q4); stack selection
  stays for functional outputs, no dead prompt to remove.
- **Headless / programmatic install + `package`** — change 0019.
- **Selectable skill-group UX** (Odoo-style concrete bundle selection) — separate follow-up; here only documented.
- **Module registry catalog** (which stack ids exist), MCP wiring, SDD methodology — unchanged.
- No project dependency version bumps (Safety gate untouched).

## Success criteria
- **SC-001** — `references/engineering-practices.md` exists, is pointed to by a lean hub block, and duplicates
  no Layer-0 rule.
- **SC-002** — Each active stack block is a heading + one inline context7 line; zero `references/stack/<id>.md`
  bodies and zero stack `.github/instructions/<id>.instructions.md` files are generated.
- **SC-003** — The 12 `layer.md.eta` templates and the `stackBody`/`generateStackReferences` body path are gone.
- **SC-004** — `sync` deletes no pre-existing user file; the migration is documented in `MAINTAINING.md` + the change.
- **SC-005** — Invariants hold: second `sync` = 0 created / 0 updated; `doctor` 0/0 and pointer-clean; `verify`
  green; `TEMPLATES_VERSION` bumped; integrity manifest re-hashed; all `test/` updated and green.
