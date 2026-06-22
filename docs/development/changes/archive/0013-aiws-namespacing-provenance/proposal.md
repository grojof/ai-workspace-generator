# Proposal: F1 — `aiws-` namespacing + provenance

## Intent

Make everything the generator owns **identifiable, reserved and stamped**, so later foundations (overlay
relations, integrity manifest, `aiws-reconcile`) and the 0012 quality work have a clean base. Today generated
skills are unprefixed and collide with upstream ecosystems (e.g. our thin `sdd-explore` vs richer global ones),
and nothing records *who owns* an artifact. Per [ADR 0003](../../../../project/decisions/0003-foundations-tenancy-provenance-reconciliation.md):
base = `aiws-*` / `aiws:*` (reserved); org = `corp-<handle>-*` / `corp-<handle>:*`.

## Scope

Ships in **two reviewable slices** (same change folder, sequential):

### F1a — Names + provenance + guard (wide, mechanical)
- **Prefix all generated skills/commands/prompts** to `aiws-*`: SDD (`aiws-sdd-explore`, `/aiws-sdd-*`),
  governance (`aiws-secure-commit`, `aiws-dependency-upgrade`, `/aiws-commit`, `/aiws-upgrade-deps`), guides
  (`aiws-workspace-guide`, `aiws-configure-workspace`, `aiws-vscode-setup`, `/aiws-configure`), `aiws-living-docs`.
  Apply via a single `AIWS = "aiws"` prefix helper, not scattered literals.
- **Skill registry ids** (`src/modules/skills.ts`) and all **doc references** (`routing.md.eta`,
  `workflow.md.eta`, `sdd/orchestrator.md.eta`) updated in lockstep.
- **Provenance frontmatter:** the `frontmatter()` helpers add `source: aiws@<TEMPLATES_VERSION>` (hash deferred to F3).
- **Reserved-namespace guard:** a validation that **rejects** any org/user pack or block id using `aiws-`/`aiws:`.

### F1b — Block-id namespace + migration (contract-sensitive)
- **Block ids → `aiws:<id>`** in `BLOCK_MANIFEST` (marker becomes `<!-- ai-workspace:begin:aiws:core -->`;
  `managed-region.ts` already escapes the `:`). Widen the invariants parse/golden regex to allow `:`.
- **`upgrade` migration:** rewrite legacy marker ids → `aiws:*`, and remove orphaned legacy skill folders/commands
  (`.claude/skills/sdd-explore/` → `aiws-sdd-explore/`), so existing repos don't end up with duplicated/orphaned
  content. Ship a migration map + a note in [MAINTAINING](../../../../project/MAINTAINING.md).
- Regenerate the byte baselines (`test/__fixtures__/agents/*.md`) + the invariants golden **deliberately**.

### Out of scope (later foundations)
- Base **stack-pack** id rename (`skill-packs/*`) → F2 (with the git company-pack + `relation`).
- The integrity **manifest** + `aiws-verify` + content hashes → F3.
- `aiws-reconcile` → F4.
- Any SDD-skill **content** improvement → 0012.

## Approach

Centralise the prefix in one helper and apply at the emission sites (`generate/*.ts`, `modules/skills.ts`). The
marker grammar already supports the colon namespace, so F1b is mostly the regex/golden/fixtures + a real
`upgrade` migration. No config-schema change.

## Affected areas

| Area | Impact |
|------|--------|
| `src/generate/{sdd,skills,governance,guides}.ts` | skill/command/prompt names → `aiws-*`; `source:` frontmatter |
| `src/modules/skills.ts`, `src/generate/skillRouting.ts` | registry ids → `aiws-*` |
| `src/generate/blockManifest.ts` | block ids → `aiws:<id>` (F1b) |
| `src/commands/upgrade.ts` | legacy-id → `aiws:*` migration + orphan cleanup (F1b) |
| `templates/core/{routing,workflow}.md.eta`, `templates/sdd/orchestrator.md.eta` | name references |
| `src/version.ts` | bump `TEMPLATES_VERSION` |
| `test/{invariants,block-manifest,generate}.test.js` + `test/__fixtures__/agents/*` | regex/golden/fixtures + reserved-namespace test |
| `docs/project/MAINTAINING.md` | migration note |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Orphaned/duplicated content in existing repos | **High** | `upgrade` migration (rewrite ids + remove old folders) shipped in F1b; documented |
| Golden/fixture churn masking a real regression | Med | Regenerate via a scripted, reviewable diff; assert old ids absent + new ids present |
| Name references drift between code and docs | Med | Single prefix helper; a test asserting routed ids all start with `aiws-` |
| Token budget growth | Low | `doctor` check after regen |

## Rollback plan

Revert the change. Because ids are renamed, a partial rollback would itself orphan content — so F1b lands as one
atomic commit (rename + migration + golden) that can be reverted wholesale before release.

## Dependencies

- None upstream. **Blocks** F2/F3/F4 and de-risks 0012 (its skills are then born `aiws-*`).

## Success criteria

- [ ] Every generated skill/command/prompt id starts with `aiws-`; every managed block id is `aiws:<id>`.
- [ ] Each owned artifact carries `source: aiws@<version>`.
- [ ] Org/user packs using the `aiws` namespace are rejected (test).
- [ ] `ai-workspace upgrade` migrates a pre-existing (legacy-id) repo with **0 orphans / 0 duplicates**.
- [ ] `npm test` green (regenerated goldens/fixtures); `doctor` green; idempotency holds; `TEMPLATES_VERSION` bumped.
