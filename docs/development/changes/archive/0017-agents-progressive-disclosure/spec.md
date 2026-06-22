# Spec — 0017a: Stack detail → references + AGENTS.md pointers

Requirements use MUST/SHOULD (RFC 2119). Delta against current generation. Slice 0017a (stack detail);
task-detail de-duplication is 0017b.

## R1 — Stack bodies move to canonical references
For every active stack entry (`stack.languages` / `frameworks` / `environments`), the full layer body that is
today rendered inline in AGENTS.md MUST instead be generated to a canonical `references/stack/<id>.md`
(neutral, target-agnostic, idempotent).

- **Given** a config with `typescript`, **when** generated, **then** `references/stack/typescript.md` exists
  and contains the TypeScript layer rules.
- **Given** a second `generate`, **then** the reference reports `unchanged` (idempotent).

## R2 — AGENTS.md keeps a resolving pointer, block ids unchanged
The `lang-*` / `fw-*` / `env-*` managed blocks MUST remain (same ids — no migration), but their **content**
becomes a compact pointer to the reference (a markdown link that resolves on disk), not the full body.

- **Given** generated AGENTS.md, **then** the `aiws:lang-typescript` block contains a link to
  `references/stack/typescript.md` and **not** the full rule text.
- **Given** `ai-workspace doctor`, **then** the 0016a dangling-reference check finds **no** broken pointer
  (every AGENTS.md stack pointer resolves).
- The block-order golden is unchanged (ids stable); byte fixtures regenerate for the new content.

## R3 — Copilot `applyTo` projection where a glob exists
When `copilot` is a target and the stack entry has a known file glob, the generator MUST also emit
`.github/instructions/<id>.instructions.md` with an `applyTo` frontmatter glob and the same body, so Copilot
auto-loads it by path. Entries without a sensible glob (e.g. most environments) MUST NOT get an instructions
file — the AGENTS.md pointer (Copilot reads AGENTS.md natively) suffices.

- **Given** `typescript` + `copilot` target, **then** `.github/instructions/typescript.instructions.md` exists
  with `applyTo` covering `**/*.ts`.
- **Given** a `copilot`-less config, **then** no `.github/instructions/<id>.instructions.md` is emitted.

## R4 — Layer-0 stays inline
`header`, `core`, `profile`, `versioning`, `safety`, `workflow`, and the intent-`routing` block MUST stay
inline and unchanged. No governance content moves to a reference.

## R5 — One source, no drift
The reference, the AGENTS.md pointer target, and the Copilot projection MUST derive from the **same** rendered
body (one template/source) so they cannot diverge. Regeneration is idempotent across all of them.

## R6 — Invariants preserved
Idempotency holds (second `generate`/`sync` = 0/0); byte fixtures regenerated deliberately; `doctor` within
budget and pointer-clean; `verify` green; `TEMPLATES_VERSION` bumped.

## Out of scope
- Task-detail de-duplication (`sdd`/`harness`/`living-docs`) — 0017b.
- Removing/renaming any block id (kept stable to avoid migration).
- Codex nested AGENTS.md (Q4: pointer-read first). This repo's contributor guide (Q3).

## Success criteria
- AGENTS.md stack blocks are pointers; the full rules live in `references/stack/<id>.md`.
- Copilot auto-loads stack rules by path; the other targets follow the pointer.
- `doctor` confirms every pointer resolves; spine token count drops by the moved bodies.
- All tests green; generation idempotent; one source per part.
