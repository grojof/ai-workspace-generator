# Clarify — 0018 · Engineering-practices baseline (replace per-stack prose)

> Phase: clarify. Resolves the ambiguities left open by `proposal.md` (Decision 4 + the items carried from
> `explore.md`) so the spec is unambiguous. The proposal's Decisions 1–3 were already confirmed by the user
> (split headless install → 0019; keep a per-stack context7 pointer; treat removed managed content as a
> documented migration). This phase nails the remaining four forks and records a grounding correction.

## Grounding correction (changes what the spec must say)

The proposal framed the risk as "removing the `lang-*`/`fw-*`/`env-*` managed-block ids." That is **not** what
happens. Those blocks are **`expand` entries keyed by each configured stack** (`blockManifest.ts:59-73`): while
a user keeps a stack, the block `lang-typescript` keeps existing — only its **content** changes. No stable
block id disappears, so the "orphaned managed block" risk does **not** apply here.

The real residue is at the **file** layer: 0017 generated `references/stack/<id>.md` (via `stackBody`) and the
Copilot projection `.github/instructions/<id>.instructions.md` (`references.ts:91-116`). Once we stop emitting
them, those **files** become orphans in existing user repos. That is the migration to handle (Q2), and it is
more contained than the proposal feared — it honors the "`writeManaged`/`sync` never deletes" invariant.

## Questions & Decisions

### Q1 — What does each configured stack emit in AGENTS.md once per-stack prose is gone?
Options: **(A)** inline one-line context7 pointer, no separate file (drop `references/stack/<id>.md` and the
Copilot projection); **(B)** keep a minimal stub `references/stack/<id>.md` + the file pointer; **(C)** emit
nothing per stack (contradicts confirmed Decision 2).

**Decision: A — inline context7 pointer, no file.** Each `lang-*/fw-*/env-*` block becomes its heading plus a
single line, e.g. `> Query **context7** for `typescript@5.x` best practices.` (environments without a version
drop the `@ver`). `stackBody`, `generateStackReferences`, and the Copilot `*.instructions.md` projection are
removed. *Why:* leanest residue, keeps version facts reachable (Decision 2), and matches the harness altitude
rules — the value now lives in the evergreen baseline (Q3) and in **skill packs**, not in N thin per-stack files.

**User emphasis recorded (reframes the value, not just Q1):** the workspace should foreground the **base
philosophy — SDD + the engineering-practices baseline** — and deliver stack/domain specifics as **selectable
skill packs / skill groups** (e.g. an Odoo group, or other concrete bundles a user picks). This is the
designed extension path. 0018 **documents** that path (Q3 + docs); it does **not** build a new
"select a skill group" UX. A concrete, user-facing skill-group selection (Odoo-style bundles) is logged as a
**follow-up candidate** (see Out of scope) so 0018 stays focused on the prune + baseline.

### Q2 — How to treat the now-orphaned 0017 files in existing user repos?
Files: `references/stack/*.md` and `.github/instructions/*.instructions.md`. Options: **(A)** document-only
migration (`sync` stops emitting; user removes them; documented in `MAINTAINING.md` + the change; optional
`doctor` advisory); **(B)** active cleanup — `sync` deletes the files it previously generated; **(C)** leave
silently.

**Decision: A — document-only migration.** *Why:* honors the project's hard invariant that `sync` never deletes
user-side content (Architecture rules: "Idempotency is sacred"; managed regions never deleted). Active deletion
(B) introduces destructive behavior into `sync` — out of altitude for this change and a Safety-gate-adjacent
risk. We document the removal in the change + `MAINTAINING.md`, keep the AGENTS.md hub heading stable so diffs
stay legible, and — if cheap — add a non-blocking `doctor` note that flags leftover `references/stack/*.md`
with no managed pointer. No automated deletion ships.

### Q3 — Breadth and opinion of `references/engineering-practices.md`?
Options: **(A)** comprehensive, language-agnostic craft baseline; **(B)** lean core only; **(C)** comprehensive
+ a stack-pattern appendix.

**Decision: A — comprehensive, language-agnostic baseline ("rules with teeth").** It covers, as generic
patterns that do **not** restate AGENTS.md Layer-0 *Universal conventions*: change discipline (small, reversible,
one logical change); data & migrations (schema changes are reviewed, reversible); secrets & supply chain (never
bake secrets into images/artifacts; justify and verify dependencies); input validation at boundaries; explicit
error handling (no silent catches); testing (test behavior, not implementation; a failing test pins a bug
first); observability (no leftover debug logging; structured logs); performance (measure before optimizing).
*Why:* the change's whole thesis is to **relocate** value, not delete it — a thin core (B) would shed value;
an appendix of named stack patterns (C) reintroduces exactly the stack specificity we are removing (those
belong in skill packs). Boundary rule: the **lean hub** in AGENTS.md keeps the one-paragraph stance + the
pointer; the **reference** carries the depth. No rule appears in both.

### Q4 — How far to simplify the `init` wizard in this change?
Options: **(A)** remove per-layer prose authoring, keep stack selection for functional outputs; **(B)** go
further — Simple skips stack questions, relies on `detect`; **(C)** defer wizard changes to a follow-up.

**Decision: C — defer wizard changes to a follow-up.** *Why:* the wizard does not actually *author* per-stack
prose today — prose comes from templates, and the wizard only **selects** stacks, which we keep for the
functional outputs (VS Code recs, `detect` seed, skill-pack gating, the context7 pointer). So removing the
template path leaves no dead wizard prompt to clean up, and touching `init.ts`/`wizard.ts` here would widen the
blast radius for no functional gain. 0018 stays a **prune + baseline + docs** change. Any wizard trimming (and
the Odoo-style skill-group selection above) lands in its own change. This supersedes proposal scope item
"Simplify the init wizard" / explore D3's wizard line — moved out of 0018.

## Resulting scope adjustments (feed the spec)

- **In scope:** add `references/engineering-practices.md` (Q3-A) + a lean hub pointer block via
  `BLOCK_MANIFEST`/`composeBlocks`; reduce `stackPointer` to the inline context7 one-liner (Q1-A); remove
  `stackBody`, `generateStackReferences`, the 12 `templates/{languages,frameworks,environments}/*/layer.md.eta`,
  and the Copilot `*.instructions.md` projection; document the skill-pack/skill-group path (Q1 emphasis) in
  `docs/project/EXTENDING.md` + `PROJECT-STATE.md`; document the file migration (Q2-A) in `MAINTAINING.md` +
  the change; bump `TEMPLATES_VERSION`; re-render; re-hash the integrity manifest; update affected `test/`.
- **Out of scope (now explicit):**
  - **Wizard simplification** → follow-up (Q4-C).
  - **Headless / programmatic install + `package`** → change **0019** (confirmed Decision 1).
  - **Selectable skill-group UX (Odoo-style concrete bundle selection)** → follow-up candidate (new change;
    needs its own propose). 0018 only documents skill packs as the path.
  - Module **registry catalog** (which stack ids exist), MCP wiring, and the SDD methodology — unchanged.
  - No project dependency version bumps (Safety gate untouched).

## Quality-bar self-check

- [x] Each question changes what the spec would say (residue shape, migration behavior, reference breadth, and
      whether the wizard/`init.ts` is touched at all — all alter requirements/scope).
- [x] Decisions are concrete enough to remove the ambiguity (exact emitted content, no-delete migration, named
      rule domains + boundary, wizard deferred).
- [x] No open `[NEEDS CLARIFICATION]` left for the spec.
