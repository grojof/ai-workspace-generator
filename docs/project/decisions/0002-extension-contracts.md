# ADR 0002 — Extension contracts: what is stable, what is pluggable, how policies and methodologies are added

- **Status:** Accepted
- **Date:** 2026-06-19
- **Deciders:** ai-workspace maintainers

## Context

The generator grows by accretion: skills, stack packs, company overlays, MCP servers, Layer-0
principles, and — soon — whole **methodologies** (a structured-prompt flow, *SPDD*, alongside the
current *SDD*) and cross-cutting **principles** (*Harness Engineering*). Two risks come with that
growth:

1. **Silent contract breakage.** AGENTS.md already calls several things sacred — "managed-region block
   ids are a stable contract", "idempotency is sacred", "binary skill assets ship byte-for-byte" — but
   these were *cultural norms*, not enforced. A refactor could break one and no test would notice until
   it reached users' repos (where `writeManaged` never deletes unknown blocks → orphaned content).
2. **Additions as surgery.** Adding a Layer-0 principle today means editing the body of `composeBlocks`
   ([src/generate/agents.ts](../../../src/generate/agents.ts)) and getting the order right by hand;
   adding a methodology means forking everything SDD touches (schema, templates, `src/generate/sdd.ts`,
   `src/i18n/strings.ts`, commands, skills). There is no first-class notion of "a principle" or "a
   methodology", so neither is an additive data edit.

This ADR makes the foundation **rock-solid first** (enforce the contracts) and **records the target
shape** for making policies and methodologies pluggable, *before* SPDD / Harness Engineering content is
written on top of it.

## Decision

### Part A — Enforced invariants (now)

The four stable contracts are enforced by [`test/invariants.test.js`](../../../test/invariants.test.js).
CI goes red if any is broken; they are no longer just prose:

| Contract | What it guarantees | How it's pinned |
|----------|--------------------|-----------------|
| **Block order & ids** | No block id is renamed, removed, reordered, or accidentally inserted (would orphan content downstream). | Golden ordered list for a maximal config + a fixed, config-independent Layer-0 prefix + uniqueness/paired-marker checks. |
| **Idempotency** | A second `generate` reports 0 created / 0 updated. | Re-run across a representative config matrix (minimal, learn, example+reasons+stack, example+business, claude-only, copilot-only). |
| **Out-of-band survival** | User prose outside the `ai-workspace:begin/end` markers always survives regeneration. | End-to-end: inject notes at top / mid-file / EOF, regenerate, assert intact. |
| **Binary byte-equivalence** | Logos and `.pptx`/`.dotx`/`.potx` templates reach the workspace unmodified (never via the utf8 text writer). | Byte-compare a shipped asset against its `skill-packs/` source. |

**Rule:** a deliberate change to a contract (e.g. a justified block rename with a migration) updates the
golden in the same commit, with the migration noted in
[MAINTAINING](../MAINTAINING.md#renaming-or-removing-a-block-id). An *accidental* change is a bug.

### Part B — Extension taxonomy (today)

How each kind of addition enters, and whether it is data or code. Recipes live in
[EXTENDING](../EXTENDING.md); this is the map of which lever to pull.

| Addition | Lever | Data or code | Additive? |
|----------|-------|--------------|-----------|
| Language / framework / environment module | template under `templates/<layer>/<id>/` + `registry.ts` | data (+ registry row) | yes — autodiscovered by `templateExists` |
| MCP server | `src/generate/mcp.ts` REGISTRY + `registry.ts` | code | yes |
| Skill / stack pack | `skill-packs/<id>/` (`SKILL.md` + `references/` + `pack.yaml`) | **data** | yes |
| Company overlay | `config.company` + `templates/company/<org>/` | data | yes |
| **Layer-0 principle** (e.g. *Harness Engineering*) | new template **+ a `blocks.push` in `composeBlocks`** | code | **no — surgery** |
| **Methodology** (e.g. *SPDD*) | scattered across schema, templates, generator, strings, commands, skills | code, many sites | **no — fork** |

The last two rows are the gap Part C closes.

### Part C — Target direction (Phase 2 — recorded, not yet built)

To make principles and methodologies additive, three declarative seams, introduced **without** breaking
the Part A contracts (the golden order must stay stable or move deliberately):

1. **Block manifest.** Replace the imperative `blocks.push(...)` sequence in `composeBlocks` with an
   ordered, data-driven list of `{ id, template, layer, gating }`. Order becomes a table the golden test
   reads, and adding a principle becomes one row.
2. **Methodology registry.** Model a methodology as a common interface
   `{ id, phases, artifacts, skills, orchestratorTemplate, gating }`. **SDD and SPDD coexist**, selected
   per repo via `workspace.config.yaml` (e.g. `methodology: sdd | spdd | both`). SDD is refactored into
   the first registry entry; SPDD becomes a second entry, not a fork. (Decision: coexistence, not
   replacement — see the open question below for the precise config surface.)
3. **Principles catalog.** Layer-0 governance principles (safety, versioning, workflow, the org
   working rules, and *Harness Engineering*) become catalog entries with metadata, so a new principle is
   a data edit that the block manifest renders in order.

Phase 2 is its own SDD change (`/sdd-explore` → `/sdd-propose`). This ADR exists so that work has a
fixed north star and so Phase-2 additions are measured against the Part A contracts.

## Boundary (what this ADR does NOT do)

- It does **not** implement the manifest, the methodology registry, or the principles catalog. Those are
  Phase 2.
- It does **not** change any generated artifact, so `TEMPLATES_VERSION` is unchanged.
- It does **not** define SPDD's or Harness Engineering's *content* — only the seams they will plug into.

## Open questions (for Phase 2) — resolved in change 0008

- ~~The exact config surface for methodology selection and its interaction with `sdd.schema`.~~
  **Resolved (0008 PR3):** axis `sdd.methodology: "sdd" | "spdd"` (no `both`), default `sdd`
  (backward-compatible). `methodology` is the *flow*; `sdd.schema` stays *spec depth*; `spdd` **implies**
  `schema: "reasons"` (the REASONS Canvas), enforced by a single `ConfigSchema` transform. SPDD reuses the
  `/sdd-*` family and `reasons` skills — not a fork.
- ~~Whether the principles catalog supersedes or wraps the per-template Layer-0 blocks.~~
  **Resolved (0008 PR2):** neither — the "catalog" *is* the always-on Layer-0 entries of `BLOCK_MANIFEST`.
  Adding a principle (e.g. `harness-engineering`) is one manifest row; no separate structure was built, in
  keeping with the ratchet principle (don't add structure before a use demands it).

## Consequences

- The contracts are **enforced**, not aspirational: the structure is hard to break by accident, which is
  the "inquebrantable" half of the goal.
- New content (skills, packs, modules) stays additive today; **principles and methodologies become
  additive only after Phase 2** — until then, adding them is still code surgery and must respect the
  golden order test.
- Every future structural change has a single place to check intent (this ADR) and a single place that
  fails if it regresses (the invariants test).
