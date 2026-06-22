# Tasks — F1: `aiws-` namespacing + provenance

## F1a.1 — skills + registry + provenance + guard
**Increment 1 (done):** provenance + naming helper.
- [x] `src/generate/naming.ts`: `AIWS`, `aiwsId()`, `isReservedNamespace()`, `skillFrontmatter()` (with `source:`).
- [x] Centralised `frontmatter()` → `skillFrontmatter` in `skills.ts` + `guides.ts` + `governance.ts`: every generated skill now carries `source: aiws@<TEMPLATES_VERSION>`. Verified (`source: aiws@0.36.0`).
- [x] Bump `TEMPLATES_VERSION` → 0.36.0; `npm test` green (79/79).

**Increment 2 (next):** the `aiws-` rename (collision fix, fixture-touching).
- [ ] Skill emission → `aiwsId`: `skills.ts` (sdd-* + living-docs), `governance.ts` (secure-commit, dependency-upgrade), `guides.ts` (workspace-guide, configure-workspace, vscode-setup) — folder + `name` + body heading + in-body skill-name refs.
- [ ] `src/modules/skills.ts`: registry ids → `aiws-*` (non-pack rows).
- [ ] `templates/core/routing.md.eta`: skill-name references → `aiws-*`.
- [ ] Reserved-namespace guard for external packs/blocks (+ test) — may move to F2 with external sources.
- [ ] Tests: `generate.test.js` id asserts → `aiws-*`; add "routed non-pack ids start with aiws-".
- [ ] Regenerate `test/__fixtures__/agents/*.md` (skill-routing block); block-order golden unchanged. `doctor` green.

## F1a.2 — commands + prose sweep (next)
- [ ] Command/prompt files → `/aiws-*`; sweep prose (workflow, orchestrator, layers, skill bodies).
- [ ] Guard test: no legacy `/sdd-`/`/commit`/`/doc-sync`/`/configure`/`/upgrade-deps` tokens in generated output.

## F1b — block-id namespace + migration (next)
- [ ] `BLOCK_MANIFEST` ids → `aiws:<id>`; widen invariants regex; update golden + byte baselines.
- [ ] `upgrade` migration (rewrite legacy ids + remove orphaned legacy skill folders); MAINTAINING note.

## Verify
- [ ] `verify-report.md` after F1a.1.
