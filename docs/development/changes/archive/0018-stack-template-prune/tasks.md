# Tasks — 0018 · Engineering-practices baseline (replace per-stack prose)

Ordered checklist derived from `spec.md` + `design.md`. `[P]` = parallelizable with its siblings. Each task
notes the requirement / decision it traces to. Order respects real dependencies: verify → author → wire →
delete → docs → mechanical → gate.

> **Apply status (all done).** Implemented in order; 125/125 tests pass, `doctor` 0/0, `verify` ✔, second
> `sync` = 0 created / 0 updated / 82 unchanged. No spec divergence. T13 intentionally skipped (optional MAY).

## 0 · Safety verification (must run first)
- [x] **T0** — Confirmed the only consumers of `stackGlob`/glob maps/`stackBody`/`generateStackReferences` were
      `references.ts` + `index.ts` (and a stale comment in `blockManifest.ts`). The per-repo 0005 `applyTo` path
      is independent. Safe to delete. *(Design trade-off: glob removal)*

## 1 · Author the baseline (ADDED R1)
- [x] **T1** [P] — Write `templates/references/engineering-practices.md.eta`: the comprehensive,
      language-agnostic baseline covering the spec domains (change discipline; data & migrations; secrets &
      supply chain; input/boundary validation; explicit error handling; testing; observability; performance).
      English-only (AI-facing). No restatement of Layer-0 *Universal conventions*. *(ADDED: baseline; AD1)*
- [x] **T2** [P] — Write `templates/core/engineering-practices.md.eta`: the lean hub block — one-paragraph
      stance + `Rules → [references/engineering-practices.md](references/engineering-practices.md)`. *(ADDED: baseline; AD1)*

## 2 · Wire generation (ADDED R1, MODIFIED)
- [x] **T3** — In `references.ts`, add `generateEngineeringBaseline(cwd, config): WriteResult` rendering T1 to
      `references/engineering-practices.md` (workspace-level, one file). *(ADDED: baseline)*
- [x] **T4** — In `blockManifest.ts`, add `{ kind: "template", id: "engineering-practices", template:
      "core/engineering-practices.md.eta" }` immediately after `harness-engineering`. *(AD4)*
- [x] **T5** — Rewrite `stackPointer(type, entry)` to return `heading + "> Query **context7** for
      \`<id>[@<ver>]\` best practices."` (environments omit `@<ver>`); drop the file link and the `applies to`
      glob note. *(MODIFIED: per-stack block; AD2)*
- [x] **T6** — In `index.ts`, replace the `generateStackReferences(...)` loop + import (lines ~182–188) with a
      single `generateEngineeringBaseline(cwd, config)` write; rename `stackRefDesc` → baseline description. *(ADDED/REMOVED)*

## 3 · Remove the prose path (REMOVED ×2)
- [x] **T7** — Delete from `references.ts`: `stackBody`, `generateStackReferences`, `stackGlob`,
      `LANGUAGE_GLOB`, `FRAMEWORK_GLOB` (keep `StackType`, `StackItem`, `LAYER`, heading construction). Update
      the file header comment. *(REMOVED: prose/bodies + Copilot projection)*
- [x] **T8** [P] — Delete the 12 `templates/{languages,frameworks,environments}/*/layer.md.eta`. *(REMOVED: templates)*
- [x] **T9** [P] — Delete this repo's now-stale dogfooded outputs: `references/stack/*.md` and any stack
      `.github/instructions/<id>.instructions.md` (authored-repo cleanup — NOT a sync-time deletion). *(Design trade-off)*

## 4 · Documentation (ADDED: skill-pack path + migration)
- [x] **T10** [P] — `docs/project/EXTENDING.md` + `docs/development/status/PROJECT-STATE.md`: state that
      stack/domain specifics now live in **skill packs / groups** (Odoo-style, selected explicitly) as the
      designed path. *(ADDED: skill-pack path)*
- [x] **T11** [P] — `docs/project/MAINTAINING.md` + this change folder: document that existing
      `references/stack/*.md` / `*.instructions.md` are now orphaned and **safe to delete by the user**;
      `sync` never deletes them. *(ADDED: non-destructive migration; AD3)*
- [x] **T12** [P] — `docs/project/ARCHITECTURE.md`: update the 0017a progressive-disclosure paragraph + the
      Layer table (`stackBody` gone; per-stack block = context7 line; new `engineering-practices` block). *(MODIFIED/ADDED)*
- [skip] **T13** [P] — *(optional, MAY)* `doctor` advisory for leftover `references/stack/*.md` — **SKIPPED**:
      not trivial to fold into the existing orphan-docs check, and the MAINTAINING migration note + `doctor`'s
      existing dangling/orphan checks already cover the nudge. Avoids gold-plating. *(AD3)*

## 5 · Mechanical invariants (SC-005)
- [x] **T14** — Bump `TEMPLATES_VERSION` in `src/version.ts`. *(SC-005)*
- [x] **T15** — `npm run build` then re-render: run `sync`; regenerate byte fixtures captured by the tests;
      re-hash `.ai-workspace/manifest.json`. *(SC-005)*
- [x] **T16** — Update `test/`: `invariants.test.js` / `block-manifest.test.js` goldens (new block + new
      per-stack content); `generate.test.js` (stack-body text + Copilot instruction → assert **not** emitted;
      baseline file + hub pointer **present**); delete `stackBody`/`stackGlob` unit tests. *(SC-001..003, 005)*

## 6 · Acceptance gate (SC-005)
- [x] **T17** — `npm test` green; `ai-workspace doctor` 0/0 and pointer-clean; `ai-workspace verify` green.
- [x] **T18** — Idempotency: a second `sync` reports **0 created / 0 updated**. *(SC-005)*

## Coverage map (requirement → tasks)
- ADDED baseline → T1, T2, T3, T4, T6.
- ADDED skill-pack path → T10.
- ADDED non-destructive migration → T11, T13, AD3 (no delete code anywhere).
- MODIFIED per-stack block → T5 (ids stable).
- REMOVED prose/bodies + Copilot projection → T0, T7, T8, T9, T16.
- SC-005 invariants → T14, T15, T16, T17, T18.
