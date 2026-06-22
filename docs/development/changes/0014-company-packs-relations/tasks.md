# Tasks — F2: company packs, overlay relations, reserved-namespace guard (0014)

## F2a — namespace the authored base packs + reserved-namespace guard (done)
**Provenance principle:** `aiws-` only on content **we author**. Vendored packs (`base:` — `find-skills`,
`mcp-builder`, `skill-creator`) and stack packs (`odoo-18.0`, `frontend-*`, `webapp-testing`) keep ecosystem names.

- [x] Renamed the 17 authored `sdd-*` fusion packs → `aiws-sdd-*` (folders + `pack.yaml` `id:` + `SKILL.md`
      `name:` frontmatter + in-body cross-references). `templated: true`, no `base:` → all authored.
- [x] Registry (`src/modules/skills.ts`): all `sdd-*` ids → `aiws-sdd-*`, including the audit-id
      `.replace("aiws-sdd-audit-", "")` trigger logic. Prose refs in `sdd.ts` + `schema.ts` updated.
- [x] Reserved-namespace **self-invariant** (`test/invariants.test.js`): every bundled pack is `aiws-*` OR
      vendored (`base:`) OR stack-bound — a future authored pack that forgets the prefix fails CI. (Runtime
      impersonation guard for external packs lands in F2c.)
- [x] Tests swept to `aiws-sdd-*` (`generate.test.js` incl. dynamic `sdd-audit-${a}` paths, `methodology.test.js`);
      regenerated 5 byte baselines; `methodologies.md` prose. `pruneRenamedOrphans` (F1b.2) covers the orphans
      automatically (same `aiws-X` → `X` rule).
- [x] Bumped `TEMPLATES_VERSION` → 0.38.0. **84/84 green** (new invariant included).

## F2b — overlay `relation` in `pack.yaml` (done)
- [x] Added `relation` (new / extends / overrides:<aiws-id>) to `PackManifestSchema` with a `superRefine`
      (format + reserved-namespace target). Helpers `packRelation()` + `parsePackManifest()` exported.
- [x] `assertRelationsResolve(packs)` checks `overrides:` targets against the live base catalog (registry
      `SKILLS` ids + bundled pack ids, with the `aiws-sdd-*` orchestrator glob); wired into `loadPacks`.
- [x] `test/pack-relations.test.js` (4 tests): defaults/parse; rejects malformed + non-reserved targets;
      existence check rejects dangling, accepts real ids + glob; all bundled packs load clean (default `new`).
- [x] Documented `relation:` in EXTENDING.md (`pack.yaml` reference). Recording into the integrity manifest
      is deferred to **F3** (no provenance sink exists yet).

## F2c — git company packs (deferred, own spec/design)
- [ ] `company` string → object `{ id, packs }` (+ config migration normalising `"example"` → `{ id: "example" }`);
      open the org id for `corp-<handle>`; fetch/pin git packs (reuse `skills sync` git+vendor); runtime
      reserved-namespace guard with teeth (reject external `aiws-*`).
