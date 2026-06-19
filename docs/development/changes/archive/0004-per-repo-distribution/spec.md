# Spec — Per-repo distribution

> Delta against `docs/development/specs/configuration.md` (the multi-repo generation baseline from 0003).
> This change makes `ai-workspace package` consume the per-repo `.claude/` outputs.

## R1 — Aggregate sources across repos
`package` MUST collect distributable artifacts from the workspace root **and** every resolved child repo.

- **Given** populated `repos[]`, **then** the source roots are the workspace root followed by each
  `resolveRepos()` entry with `path !== "."`, in order.
- **Given** empty `repos[]`, **then** the only source root is the workspace root (today's behavior).

## R2 — Skills, commands, and agents are aggregated
The umbrella plugin MUST include skills, commands, and companion subagents found under **any** source root.

- **Given** `app-a` ships the `odoo-18.0` pack (and its `odoo-code-*` agents) and `app-b` ships the react
  packs, **then** `plugins/<plugin>/skills/` contains the root workflow skills plus `odoo-18.0` plus the
  react packs, and `plugins/<plugin>/agents/` contains the odoo companion agents.

## R3 — Deterministic de-duplication (first-wins)
When the same id appears under more than one source root, it MUST be included exactly once.

- **Given** an id present under both the root and a child (or two children), **then** the first occurrence
  wins (root before children; children in `resolveRepos` order) and later ones are skipped.
- **Given** any input, **then** the aggregation order is stable (deterministic output across runs).

## R4 — Org zips and install guide reflect the aggregate
The per-skill org zips and `INSTALL.md` MUST be built from the aggregated, de-duplicated skill set.

- **Given** a multi-repo workspace, **then** `dist/org-skills/` has one zip per aggregated skill id (SKILL.md
  at the zip root) and `INSTALL.md` lists those ids.

## R5 — Single-repo unchanged + idempotent
- **Given** empty `repos[]`, **then** `package` produces the same output as before this change.
- **Given** any config, **then** a second `package` reports nothing created/updated (deterministic).

## Acceptance
Multi-repo `package` yields one umbrella plugin aggregating root + child skills/commands/agents (deduped,
deterministic) with matching org zips and install guide; single-repo output is unchanged; build + full suite
green; second `package` is a no-op.
