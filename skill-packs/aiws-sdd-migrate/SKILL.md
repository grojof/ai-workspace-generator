---
name: aiws-sdd-migrate
description: >
  Migrate a legacy non-Git SDD workspace (`_vN` filenames + `sdd_docs/`) to the unified Git-based model. Trigger: adopting this generator on a repo built with standalone, pre-Git SDD plugins.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-migrate — legacy non-Git SDD → unified model (one-off, advanced)

Migrate a workspace built with standalone, **pre-Git SDD** plugins (no-Git v1) to this generator's
unified model: `_vN` filename versioning → **Git**, and the parallel `sdd_docs/` trail → the single
`{{paths.development}}/` store. One-time, **opt-in**, advanced/IT use — not forced on anyone.

### Detect (stop if none of these are present)
- `_vN`-suffixed specs (e.g. `specs/001-foo_v3.md`), a `specs/archive/` folder, and/or a `sdd_docs/` folder.
If the repo already uses `{{paths.specs}}/<NNN>-<slug>.md` + Git, there is nothing to migrate.

### Plan first (no writes)
Require a **clean git working tree** (commit/stash first) — Git is the safety net. Produce a migration plan
and show it; proceed only on explicit confirmation. Do every step as its own reversible commit.

### Steps
1. **Specs `_vN` → Git.** Per `spec_id`, keep the highest-version file as the canonical
   `{{paths.specs}}/<NNN>-<slug>.md` (drop the `_vN` suffix). The version history already lives in §0 Changelog;
   the old `_vN` + `specs/archive/` copies become **Git history** — remove the duplicates in the migration
   commit (recoverable via Git). Preserve each spec's frontmatter `status`.
2. **`sdd_docs/` trail → unified store.** The per-skill trail files carry process notes: fold durable
   decisions into `{{paths.status}}/PROJECT-STATE.md` and any in-flight context into `{{paths.changes}}/<change>/`.
   Then remove `sdd_docs/`.
3. **Lifecycle.** Status is unchanged; from now on `aiws-sdd-spec-review` drives transitions over Git (no `_vN`).
4. **Config.** Set `sdd.schema: reasons` (+ `appProfile` if applicable) in `workspace.config.yaml`; run
   `ai-workspace sync` to project AGENTS.md + skills.

### Safety
- Never delete anything not already committed to Git. One commit per logical step; each reversible.
- A malformed spec stops the migration — surface it, don't migrate a corrupted spec.
- Report a summary: N specs migrated, M trail files folded, `archive/` + `sdd_docs/` removed.

### After
`git log` shows the migration commits; specs validate against `aiws-sdd-spec-schema`; run `sdd-audit-*` before sign-off.
