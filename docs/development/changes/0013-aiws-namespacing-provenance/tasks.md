# Tasks — F1: `aiws-` namespacing + provenance

## F1a.1 — skills + registry + provenance + guard
**Increment 1 (done):** provenance + naming helper.
- [x] `src/generate/naming.ts`: `AIWS`, `aiwsId()`, `isReservedNamespace()`, `skillFrontmatter()` (with `source:`).
- [x] Centralised `frontmatter()` → `skillFrontmatter` in `skills.ts` + `guides.ts` + `governance.ts`: every generated skill now carries `source: aiws@<TEMPLATES_VERSION>`. Verified (`source: aiws@0.36.0`).
- [x] Bump `TEMPLATES_VERSION` → 0.36.0; `npm test` green (79/79).

**Increment 2 (done):** the `aiws-` rename (collision fix, fixture-touching).
- [x] Skill emission → `aiwsId`: `skills.ts` (sdd-* via `aiwsId(p.name)` + `aiws-living-docs`), `governance.ts` (`aiws-secure-commit`, `aiws-dependency-upgrade`), `guides.ts` (`aiws-workspace-guide`, `aiws-configure-workspace`, `aiws-vscode-setup`), `learning.ts` (`aiws-learn` + frontmatter centralised) — folder + `name` + body heading + in-body skill-name refs.
- [x] `src/modules/skills.ts`: 8 non-pack registry ids → `aiws-*` (pack rows left for F2).
- [x] `templates/core/routing.md.eta`: skill-name references → `aiws-*`.
- [x] Tests: `generate.test.js` + `multi-repo.test.js` skill-path asserts → `aiws-*`. Regenerated `test/__fixtures__/agents/*.md` (skill-routing block only; block-order golden unchanged). 79/79 green; `doctor` 0/0 (AGENTS.md 5787/6000). Verified: all base skills emit as `aiws-*` (packs `find-skills`/`mcp-builder`/`skill-creator` remain → F2).
- [ ] Reserved-namespace guard (+ test) — deferred to F2 (lands with external/git pack sources).

## F1a.2 — commands + prose sweep (next)
- [ ] Command/prompt files → `/aiws-*`; sweep prose (workflow, orchestrator, layers, skill bodies).
- [ ] Guard test: no legacy `/sdd-`/`/commit`/`/doc-sync`/`/configure`/`/upgrade-deps` tokens in generated output.

## F1b — block-id namespace + migration (next)
- [ ] `BLOCK_MANIFEST` ids → `aiws:<id>`; widen invariants regex; update golden + byte baselines.
- [ ] `upgrade` migration (rewrite legacy ids + remove orphaned legacy skill folders); MAINTAINING note.

## Verify
- [ ] `verify-report.md` after F1a.1.
