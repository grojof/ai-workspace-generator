# Spec — F1: `aiws-` namespacing + provenance

Requirements use MUST/SHOULD. Delta against current generation. Slices: F1a (names+provenance+guard),
F1b (block-id namespace + migration).

## R1 — Generated skills are `aiws-`-namespaced (F1a.1)
Every skill the generator emits MUST have an id/folder/frontmatter-name starting with `aiws-`.

- **Given** a default config, **when** generated, **then** `.claude/skills/` contains `aiws-sdd-explore`,
  `aiws-secure-commit`, `aiws-configure-workspace`, `aiws-living-docs`, … and **no** unprefixed equivalents.
- **Given** the skill-routing block, **then** every routed skill id starts with `aiws-` (or is a stack-pack id,
  renamed in F2).

## R2 — Provenance stamp (F1a.1)
Every generated skill MUST carry `source: aiws@<TEMPLATES_VERSION>` in its frontmatter metadata.

## R3 — Reserved-namespace guard (F1a.1)
The generator MUST reject any org/user pack or block id that uses the `aiws-` / `aiws:` namespace.

- **Given** a stack pack with `id: aiws-foo`, **when** loaded, **then** generation fails with a clear error.

## R4 — Commands are `aiws-`-namespaced (F1a.2)
Every generated slash command/prompt MUST be `/aiws-*`, and all in-repo prose references MUST match.

- **Given** generated AGENTS.md + skills, **then** they contain no unprefixed legacy command tokens
  (`/sdd-`, `/commit`, `/doc-sync`, `/configure`, `/upgrade-deps`) — asserted by a guard test.

## R5 — Block ids are `aiws:`-namespaced + migration (F1b)
Managed block ids MUST be `aiws:<id>`; `ai-workspace upgrade` MUST migrate existing repos (rewrite legacy
marker ids, remove orphaned legacy skill folders) with **0 orphans / 0 duplicates**.

## R6 — Invariants preserved
Idempotency holds; the block-order golden stays stable (F1a) or moves deliberately with the rename (F1b);
byte baselines regenerated intentionally; `doctor` within budget; `TEMPLATES_VERSION` bumped.

## Out of scope
- Base stack-pack id rename (F2). Integrity manifest/hash + `aiws-verify` (F3). `aiws-reconcile` (F4).
- SDD-skill content quality (0012).

## Acceptance summary
All generated skills/commands/blocks carry the reserved `aiws` namespace with a provenance stamp; the namespace
is guarded; existing repos migrate cleanly; invariants + tests green.
