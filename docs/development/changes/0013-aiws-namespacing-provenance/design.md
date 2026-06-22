# Design — F1: `aiws-` namespacing + provenance

## Overview

Centralise the namespace in one helper and apply it at every emission site. Split for safe review:
- **F1a.1** skills + registry + provenance + reserved guard + skill-name prose. Bounded fixture churn (only the
  `skill-routing` block changes).
- **F1a.2** command/prompt rename + prose sweep + anti-leak guard test.
- **F1b** block-id namespace `aiws:<id>` + `upgrade` migration (separate, contract-sensitive commit).

## F1a.1 — design

1. **`src/generate/naming.ts`** (new): `export const AIWS = "aiws";` + `aiwsId(id)=> \`${AIWS}-${id}\`` +
   `isReservedNamespace(id)=> id===AIWS || id.startsWith(\`${AIWS}-\`) || id.startsWith(\`${AIWS}:\`)`.
2. **Skill emission → `aiwsId(...)`:**
   - `src/generate/skills.ts`: SDD skill name/folder `aiwsId(p.name)`; `aiws-living-docs`.
   - `src/generate/governance.ts`: `aiws-secure-commit`, `aiws-dependency-upgrade`.
   - `src/generate/guides.ts`: `aiws-workspace-guide`, `aiws-configure-workspace`, `aiws-vscode-setup`.
   - The skill **frontmatter `name`** matches the folder.
3. **Registry ids** (`src/modules/skills.ts`): `secure-commit→aiws-secure-commit`, `dependency-upgrade→…`,
   `sdd-*→aiws-sdd-*`, `configure-workspace→…`, `vscode-setup→…`, `learn→aiws-learn`, REASONS pack rows stay
   (stack-pack ids renamed in F2). `skillRouting.ts` renders these → routing table now lists `aiws-*`.
4. **Provenance:** the two `frontmatter()` helpers gain a `source: aiws@${TEMPLATES_VERSION}` line under
   `metadata:`.
5. **Reserved guard:** in stack-pack loading (`stackPacks.ts`) / `doctor`, throw if a non-base pack/block id
   `isReservedNamespace`. (Base packs are exempt — they ARE aiws once renamed in F2; for now base packs keep their
   ids and the guard applies to *external* packs only.)
6. **Skill-name prose:** `templates/core/routing.md.eta` names skills (`secure-commit`, `dependency-upgrade`,
   `ai-workspace-guide`, `vscode-setup`) → update to `aiws-*`.
7. **Tests:** `generate.test.js` id assertions → `aiws-*`; add a test "every routed non-pack skill id starts with
   `aiws-`" and the reserved-guard test. Regenerate `agents/*.md` byte baselines (skill-routing block changed).
   Block-order golden unchanged. Bump `TEMPLATES_VERSION`.

## F1a.2 — design (next)
- Command/prompt files `aiwsId(name)`; `/sdd-*→/aiws-sdd-*`, `/commit→/aiws-commit`, `/upgrade-deps→…`,
  `/configure→/aiws-configure`, `/doc-sync→/aiws-doc-sync`, `/aiws-guide` (already). Sweep prose in
  `workflow.md.eta`, `sdd/orchestrator.md.eta`, language/framework layers, skill bodies. Guard test: generated
  output contains no legacy `/sdd-`/`/commit`/`/doc-sync`/… tokens.

## F1b — design (next)
- `BLOCK_MANIFEST` ids → `aiws:<id>`; widen the invariants regex `([a-zA-Z0-9-]+)`→`([a-zA-Z0-9:-]+)`; update
  golden + byte baselines; `upgrade` rewrites legacy ids and removes orphaned legacy skill folders; MAINTAINING note.

## Why
- One prefix helper avoids scattered literals and drift; a guard test makes the sweeping rename verifiable.
- Slicing isolates the bounded change (F1a.1) from the prose-heavy one (F1a.2) and the contract one (F1b).

## Risks / mitigations
- Missed prose reference → guard test (F1a.2). Fixture churn → scripted regen + assert old ids absent/new present.
- Existing-repo orphans → `upgrade` migration (F1b). Token budget → `doctor` after regen.
