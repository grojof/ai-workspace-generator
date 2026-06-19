# Proposal — Per-repo distribution

## Intent
Make `ai-workspace package` **multi-repo aware**. After 0003, per-repo stack skill packs (and their companion
subagents) live under each child repo's `.claude/` — but `runPackage` still reads only the **root**
`.claude/`, so a multi-repo workspace's distribution silently **drops every child repo's stack skill**. 0004
closes that gap: the umbrella plugin and the per-skill org zips **aggregate** the root plus every resolved
repo, deterministically de-duplicated.

## Scope
- Collect distributable sources from an ordered list of roots: the workspace root first, then each
  `resolveRepos()` child (`path !== "."`). Single-repo (empty `repos[]`) ⇒ just the root → unchanged.
- Aggregate **skills**, **commands**, and **companion agents** across those roots into the single umbrella
  plugin (`plugins/<plugin>/`), and build the per-skill org zips from the aggregated skill set.
- **De-dupe by id, first-wins** (root before children, children in `resolveRepos` order). The same id from a
  later repo is skipped (assumes same id = same skill).
- Keep one umbrella plugin + one marketplace entry (topology unchanged); only the *sources* broaden.
- `INSTALL.md` lists the aggregated skill ids.

## Out of scope
- One-plugin-per-repo topology / multiple marketplace entries (rejected in clarify — umbrella stays).
- Id-collision namespacing or hard-fail (rejected — deterministic first-wins).
- Per-repo divergent distribution identity (`distribution` stays workspace-level).

## Risks
- **Single-repo drift.** The aggregation must be a no-op for single-repo. *Mitigation:* the source list is
  `[root]` when `repos[]` is empty (same dirs `runPackage` reads today); covered by the existing package
  tests + an idempotency assertion.
- **Silent id shadowing.** First-wins hides a later repo's same-id skill. *Mitigation:* documented behavior;
  stack-pack ids are stack-specific so real collisions are unlikely.

## Acceptance
- A multi-repo config (e.g. `app-a`→odoo, `app-b`→react) packages an umbrella plugin whose `skills/` contains
  the root workflow skills **and** `odoo-18.0` (from `app-a`) **and** `frontend-ui-dark-ts` (from `app-b`),
  with matching org zips in `dist/org-skills/` and ids listed in `INSTALL.md`.
- A single-repo config packages exactly as before (unchanged output).
- `npm run build` + full suite green; a second `package` writes nothing new (idempotent).
