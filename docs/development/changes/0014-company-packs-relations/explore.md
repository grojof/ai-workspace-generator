# Explore — F2: company packs, overlay relations, reserved-namespace guard

ADR 0003 part C (overlay relation), D (consume-base + git company pack), and the F2 line of the
re-sequenced roadmap. Builds on F1 (namespace `aiws-*`/`aiws:*` + provenance + automated migration).

## Current reality (grounding)

- **`company` is a closed enum** `z.enum(["none", "example"])` (`src/config/schema.ts`). It drives three
  things: the org overlay template (`templates/company/{company}/overlay.md.eta`), pack **gating**
  (`gating.company: any | ["example"]` in `src/generate/stackPacks.ts`), and per-pack
  `overlay.<company>.md` injection. Single tenancy (personal/freelance = `corp-<handle>`) needs arbitrary
  org ids → the enum must open up with a graceful fallback when no overlay template exists.
- **`pack.yaml`** (`PackManifest` in `stackPacks.ts`) carries `id`, `base`, `profile`, `loadMode`,
  `templated`, `license`, `attribution`, `trigger`, `gating`, `agents`, `routing`. **No `relation` field.**
  Overlays apply as managed blocks (`pack-overlay`, `company-overlay`) appended to `SKILL.md`.
- **Company/corp packs already exist as an in-repo extension point** (`skill-packs/corp-<x>-<org>/`,
  documented in EXTENDING.md) consumed via `ai-workspace skills sync` from a `vendor/` mirror. They are
  **not** fetched from an external git repo at generate time.
- **Base packs are NOT yet namespaced**: `find-skills`, `mcp-builder`, `skill-creator`, and the `sdd-*`
  fusion packs (spec-schema, onboarding, audits, builder, migrate, spec-sync, code-maintenance) keep bare
  ids — F1a explicitly left them for F2. `pruneRenamedOrphans` (F1b.2) already removes their orphans on upgrade.
- **Reserved namespace** is already expressible: `isReservedNamespace()` exists in `naming.ts` (F1a) but is
  not yet wired into any pack-loading guard.

## Forces

- These four pieces differ wildly in size and risk: a pack rename is mechanical; a `relation` field is
  schema+validation; **git company packs** touch the network, config shape (`company` string → object),
  fetching/pinning/caching, and trust — its own design with several forks. Bundling them risks a giant branch.
- The namespace story for packs (rename + reserved guard) is cheap, unblocks a clean catalog, and benefits
  immediately from the migration shipped in F1b. It should not wait behind the git-fetch design.

## Open questions (resolved in proposal.md)

1. Split F2 into increments, or land as one change?
2. How does `company` carry packs — a sibling `companyPacks: []`, or `company` becomes an object?
3. Does opening the `company` enum belong in the cheap first increment or with the git-pack work?
