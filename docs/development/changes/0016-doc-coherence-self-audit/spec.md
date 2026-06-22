# Spec — 0016a: Doc-structure contract + coherence checks

Requirements use MUST/SHOULD (RFC 2119). Delta against current generation/doctor. This is slice **0016a**;
the `aiws-audit` skill is 0016b, the AGENTS.md split (0016c) is deferred.

## R1 — Doc-structure contract
The config MUST support an optional `docs.contract`: a declared list of expected docs, each with a `path`,
an `owner` (`authored` | `generated` | `byte-for-byte`), and an optional `description`. It MUST default to a
sensible built-in contract (the docs the generator itself produces) so existing configs need no change.

- **Given** a config with no `docs.contract`, **when** loaded, **then** the default contract is applied and
  generation/doctor behave as before (no breakage).
- **Given** a `docs.contract` entry whose `owner` is invalid, **when** the config is parsed, **then**
  validation fails with a clear zod error at the boundary.

## R2 — Generated docs index mirrors the contract
`generate` MUST emit a `docs/INDEX.md` that lists every contract entry (path · owner · description), so the
contract is human- and agent-readable. It MUST be idempotent (a second run reports `unchanged`).

- **Given** a default config, **when** generated twice, **then** `docs/INDEX.md` exists and the second run
  reports 0 created / 0 updated for it.

## R3 — `doctor` detects dangling references
`doctor` MUST report (level `warn`) any workspace-relative link in a tracked doc/skill that points to a path
which does not exist on disk. It MUST NOT flag external URLs, anchors, or non-path link text.

- **Given** a doc containing `](docs/does-not-exist.md)`, **when** `doctor` runs, **then** it emits a
  `warn` naming the file and the missing target.
- **Given** all references resolve, **then** `doctor` emits an `ok` for reference integrity.

## R4 — `doctor` detects orphan docs
`doctor` MUST report (level `warn`) any file **under `docs/`** that the contract does not declare and that no
tracked doc links to. It MUST whitelist repo-root docs (`README*`, `LICENSE*`, `SECURITY*`, `CHANGELOG*`,
`CONTRIBUTING*`) and MUST NOT flag SDD change artifacts under `docs/development/changes/`.

- **Given** a stray `docs/notes/old.md` neither declared nor linked, **when** `doctor` runs, **then** it
  emits a `warn` naming it as an orphan.
- **Given** only declared/linked docs, **then** `doctor` emits an `ok` for orphans.

## R5 — `doc-sync` / living-docs cover `docs/project/`
The living-docs refresh (and the generated `aiws-doc-sync` instructions) MUST extend beyond
`docs/development/status/` to the project-facing docs the contract declares under `docs/project/`, so they are
kept in scope rather than drifting unmanaged.

- **Given** the generated `aiws-doc-sync` command/skill, **then** its instructions reference refreshing the
  `docs/project/` docs declared in the contract, not only `PROJECT-STATE.md` / `ARCHITECTURE.md`.

## R6 — Audit backlog cleared (repo-only, separate commit)
Completed changes 0012–0015 MUST be archived (folded into `docs/development/specs/` where they define a
baseline, then moved to `docs/development/changes/archive/`). `PROJECT-STATE.md` MUST be refreshed to the
current state (v0.2.0 shipped, ADR 0003 complete). The block-id table in `docs/project/ARCHITECTURE.md` MUST
use the `aiws:` ids actually emitted.

## R7 — Invariants preserved
Idempotency holds (second `generate`/`sync` = 0/0); the new `doctor` checks default to `warn` (never break a
clean repo); byte baselines regenerated deliberately if generation output changes; `doctor` stays within
budget; `TEMPLATES_VERSION` bumped when generated output changes.

## Out of scope
- `aiws-audit` skill/command (0016b). AGENTS.md split (0016c, deferred). Auto-fixing drift (read-only only).

## Success criteria
- A repo with a dangling reference or an orphan doc is flagged by `doctor` (the audit's findings would have
  been caught automatically).
- The doc contract + `docs/INDEX.md` make "what docs should exist" explicit and checkable.
- `doc-sync` no longer leaves `docs/project/` unmanaged.
- The SDD store is tidy (0012–0015 archived) and the living docs are current.
- All tests green; generation idempotent.
