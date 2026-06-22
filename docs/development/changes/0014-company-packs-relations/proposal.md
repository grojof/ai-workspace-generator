# Proposal — F2: company packs, overlay relations, reserved-namespace guard

## Why

ADR 0003 closes the foundations with the **extend/upgrade** story: a company consumes the base as a
versioned dependency and keeps its own additions in a **git company pack**, pulling base updates without
losing its work; `aiws-reconcile` (F4) audits those additions against the base. That audit needs two things
F1 did not deliver: (1) a declared **relation** on each company overlay (extends / overrides:<aiws-id> /
new) — the auditable primitive; (2) a hard **reserved-namespace guard** so an external pack cannot
impersonate the base by shipping `aiws-*` ids. It also needs the base catalog itself fully namespaced.

## Recommended scope: split F2 into three increments

F2's pieces differ too much in size and risk to land together (the same reason F1 split into F1a/F1b).
Recommended order — cheap and unblocking first, network/design-heavy last:

### F2a — namespace the base packs + reserved-namespace guard *(mechanical + validation, no network)*
- Rename the bundled non-aiws packs to `aiws-*`: `find-skills`, `mcp-builder`, `skill-creator`, and the
  `sdd-*` fusion family (spec-schema, onboarding, audits, builder, migrate, spec-sync, code-maintenance).
  Folder renames in `skill-packs/`, `pack.yaml` `id:`, registry rows in `src/modules/skills.ts`,
  `gating`/routing references. `pruneRenamedOrphans` (F1b.2) already cleans the orphans on `upgrade`.
- Wire `isReservedNamespace()` into pack loading: a pack whose `id` is `aiws-*`/`aiws:*` but whose
  **source is not the base** is rejected with a clear error (impersonation guard). Bundled base packs are
  exempt by construction.
- Tests: every bundled pack id is `aiws-*`; an external pack claiming `aiws-foo` is rejected; byte
  baselines / routing fixtures updated. Bump `TEMPLATES_VERSION`.

### F2b — overlay `relation` in `pack.yaml` *(schema + validation, surfaced for reconcile)*
- Add an optional `relation` to overlay metadata: `extends` (adds to a base skill), `overrides:<aiws-id>`
  (replaces/augments a named base skill — id must be a real `aiws-*`), or `new` (independent company skill).
  Validate at load (`zod`): `overrides` must target an existing base id; `extends`/`overrides` require a base.
- Record the relation in the generated artifact's provenance (frontmatter/metadata) so `aiws-verify`/
  `aiws-reconcile` (F3/F4) can read it without re-deriving. No behavioral change to composition yet.
- Tests: each relation kind validates; a dangling `overrides:aiws-missing` is rejected.

### F2c — git company packs *(network + config shape, its own design — defer)*
- Open `company` for arbitrary org ids (`corp-<handle>`) with a graceful fallback when no overlay template
  exists. Add `company` pack sources fetched/pinned by ref (reuse the `skills sync` git+vendor mechanism).
- This is the heavy, trust- and network-sensitive piece (Safety gate: outward-facing fetch). It gets its
  own spec/design pass after F2a/F2b land. Flagged here so the schema choices below are made with it in view.

## Decisions (confirmed)

1. **Increment split** — ✅ proceed **F2a → F2b → F2c**. Land F2a first (this change's first increment).
2. **How `company` carries packs** — ✅ **(B) `company` becomes an object `{ id, packs }`**, matching the
   literal `config.company.packs` in ADR 0003. This is a breaking config reshape (string → object) touching
   schema, `templates/company/{company}/`, gating, and `overlay.<company>.md` resolution; it is implemented
   **in F2c** alongside the git-pack fetch (F2a/F2b do not need it). A config migration normalises the legacy
   `company: "example"` string to `{ id: "example" }`. Recorded now so F2a/F2b are built knowing the target.
3. **Opening the `company` enum** — ✅ with the git-pack work in **F2c** (F2a/F2b don't need it).

> This change (0014) delivers **F2a**. F2b and F2c follow as their own increments/changes.

## Out of scope
F3 (integrity manifest + `aiws-verify`), F4 (`aiws-reconcile`), 0012 (SDD-skill quality), distribution ADR.

## Risks
- Pack rename is another id-contract migration — mitigated: `pruneRenamedOrphans` already handles orphans;
  byte/routing fixtures pinned; `TEMPLATES_VERSION` bump.
- Reserved-namespace guard must not reject the legitimate base — exemption keyed to pack source, tested.
