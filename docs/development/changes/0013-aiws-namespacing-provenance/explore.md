# Exploration: 0013 — F1: `aiws-` namespacing + provenance

> Foundation change F1 from [ADR 0003](../../../project/decisions/0003-foundations-tenancy-provenance-reconciliation.md).
> Enables every later foundation (relation, integrity, reconcile) and de-risks 0012.

## Goal

Give everything the generator owns a **reserved, identifiable namespace** and a **provenance stamp**:
- Skills / commands / prompts → **`aiws-*`** (e.g. `aiws-sdd-explore`, `/aiws-secure-commit`).
- Managed block ids → **`aiws:<id>`** (e.g. `aiws:core`, `aiws:sdd`).
- Each owned artifact stamped `source: aiws@<TEMPLATES_VERSION>` (+ a content hash later, F3).
- Reject org/user packs that use the `aiws-`/`aiws:` namespace (impersonation guard).

## Current state / affected areas

**Marker system is namespace-ready.** `src/render/managed-region.ts` interpolates the id into
`<!-- ai-workspace:begin:<id> -->` and `upsertBlock` **escapes the full marker** (`escapeRegExp`), so an id
containing `:` (e.g. `aiws:core`) works at write time. The only blocker is the **golden/parse regex** in
`test/invariants.test.js` (`ai-workspace:begin:([a-zA-Z0-9-]+)` → must allow `:`). The `ai-workspace:` marker
prefix stays (the tool's marker), the **id** gains the `aiws:` tier.

**Where ids/names are produced:**
- Block ids — `BLOCK_MANIFEST` ([src/generate/blockManifest.ts](../../../../src/generate/blockManifest.ts)): `header`,`core`,`profile`,`versioning`,`safety`,`workflow`,`harness-engineering`,`routing`,`skill-routing`,`tech-selection`,`lang-*`,`fw-*`,`env-*`,`company-overlay`,`company`,`business`,`sdd`,`living-docs`.
- SDD skills/commands/prompts — `p.name` in [strings.ts](../../../../src/i18n/strings.ts) drives [sdd.ts](../../../../src/generate/sdd.ts) (`.claude/commands/${p.name}.md`, `/sdd-*`) + [skills.ts](../../../../src/generate/skills.ts) (`.claude/skills/${p.name}/SKILL.md`).
- Governance skills/commands — [governance.ts](../../../../src/generate/governance.ts): `secure-commit`, `dependency-upgrade`, `/commit`, `/upgrade-deps`.
- Guide skills/commands — [guides.ts](../../../../src/generate/guides.ts): `ai-workspace-guide`, `configure-workspace`, `vscode-setup`, `/configure`, `/aiws-guide`.
- `living-docs` skill — skills.ts.
- Skill **registry** ids + triggers — [modules/skills.ts](../../../../src/modules/skills.ts) (`secure-commit`, `dependency-upgrade`, `sdd-*`, `configure-workspace`, …) → rendered by [skillRouting.ts](../../../../src/generate/skillRouting.ts).
- Stack-pack ids — `skill-packs/*/pack.yaml` (e.g. `sdd-spec-schema`, `sdd-audit-*`, `odoo-18.0`). These are **base** packs → also `aiws-`? (open question — see below).
- **Doc references to names** inside templates: `routing.md.eta`, `workflow.md.eta`, `sdd/orchestrator.md.eta` mention `/sdd-*`, `secure-commit`, `dependency-upgrade`, `ai-workspace-guide`, `vscode-setup`.
- **Frontmatter** helpers (`frontmatter()` in skills.ts & guides.ts) → add `source:` provenance.
- **Tests:** `test/invariants.test.js` (golden ids + regex), `test/block-manifest.test.js` (byte fixtures), `test/generate.test.js` (asserts skill ids like `secure-commit`, `configure-workspace`), `test/wizard.test.js` unaffected.

## Approaches

1. **Single split: F1a (skill/command rename + provenance + lint) then F1b (block-id namespace + migration).**
   - F1a: prefix all generated **skills/commands/prompts/registry ids** to `aiws-*`; add `source: aiws@ver`
     frontmatter; add the reserved-namespace lint; update doc references. Mechanical, wide.
   - F1b: prefix **block ids** to `aiws:<id>` (regex + golden + byte fixtures) + **upgrade auto-migration**
     (rewrite old marker ids → new; delete orphaned old skill folders) — the risky contract part.
   - Pros: separates the wide-but-safe rename from the contract-sensitive marker change; each reviewable.
   - Effort: Medium each.
2. **One big-bang rename.** Everything at once.
   - Pros: one migration. Cons: huge diff, harder review, more risk landing the marker change + every fixture together.

## Key decisions to settle in the proposal

- **Block-id grammar:** adopt `aiws:<id>` (colon, true namespace; needs the regex widening) vs `aiws-<id>`
  (hyphen, fits today's grammar). ADR 0003 chose `aiws:` → go with colon + widen the regex.
- **Migration for existing repos:** `upgrade` must (a) rewrite old block-marker ids → new, (b) remove orphaned
  old skill folders/commands (`.claude/skills/sdd-explore/` → `aiws-sdd-explore/`). Without this, users get
  duplicated/orphaned content (the very contract risk ADR 0002 warns about).
- **Do base stack-packs get `aiws-`?** They are base (ours) but live as data in `skill-packs/`. Likely yes for
  consistency (`aiws-sdd-spec-schema`), but that's a larger pack rename — consider deferring pack ids to F2.
- **Commands prefix:** `/aiws-sdd-explore` etc. (consistent) vs keep `/sdd-*` (shorter, but collides). ADR →
  prefix.

## Risks

- **Contract migration (high).** Renaming block ids + skill folders orphans content in users' repos unless
  `upgrade` migrates. Must ship the migration + golden update in the same change (ADR 0002 Part A rule).
- **Fixture churn (med).** All `agents/*.md` byte baselines + the invariants golden change → regenerate deliberately.
- **Doc/name drift (med).** Every template/doc that names a skill/command must update in lockstep.
- **Token budget (low).** `aiws-`/`aiws:` adds a few chars per id; check `doctor` budget.

## Ready for proposal

**Yes.** Recommend **Approach 1** (F1a then F1b) with the colon namespace + a real `upgrade` migration. Base
stack-pack id renaming deferred to F2 (with the git company-pack + relation work).
