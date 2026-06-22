# ADR 0003 — Foundations: single tenancy, provenance/namespacing, overlay relations, reconciliation, integrity & the extend/upgrade model

- **Status:** Accepted (direction recorded; implementation is later SDD changes)
- **Date:** 2026-06-22
- **Deciders:** ai-workspace maintainers
- **Builds on:** [ADR 0002 — Extension contracts](0002-extension-contracts.md). **Feeds:** change `0012` (generated-harness quality) and a distribution ADR.

## Context

The generator's value vs. plain SDD scaffolders (Spec-Kit, OpenSpec — both thin "init-once" CLIs) is the
**config-driven, single-source, idempotent, layered governance engine**: the one thing that lets a team/company
**standardise norms across many repos and tools and push updates without drift**. Research (see
[changes/0012-generated-harness-quality/research.md](../../development/changes/0012-generated-harness-quality/research.md))
confirmed AGENTS.md is becoming the universal native instructions file, so the moat is governance, not scaffolding.

But the moment we picture **base philosophy (ours) + company extensions + future base updates**, it turns chaotic:
overlays only "add text", nothing declares *what* they change, generated skills collide by name with upstream
ecosystems (e.g. our thin `sdd-explore` vs. richer global ones), and "how does a company keep its stuff while
pulling our updates?" has no clean answer. A git **fork of the tool** is the heavyweight, conflict-prone path.

This ADR fixes the **foundations** so robustness + modularity are simple and maintainable by an AI or a person,
*before* the large quality work (0012) is built on top.

## Decision

### Part A — One tenancy model (personal = a company)

There is **no "personal vs company" duality**. Every workspace has exactly **one active org tenant**:

- **`aiws`** — the canonical base ("vendor" layer), shipped by this generator.
- **one org overlay** — the company **or** the freelance identity, both modelled identically as
  **`corp-<handle>`** (e.g. `corp-acme`, `corp-grojof`). Personal/freelance is just `corp-<your-handle>`.

Same rigidity and configuration system for everyone; only the *intensity* of the overlay differs (a freelancer
uses fewer layers than a corporation). Docs stop describing "modes" and describe **base + your overlay**.

### Part B — Namespacing & provenance (everything identifiable)

Reserved, prefixed, stamped:

| Tier | Skills / commands | Block ids | Owns |
|------|-------------------|-----------|------|
| Base (ours) | **`aiws-*`** (`aiws-sdd-explore`, `/aiws-secure-commit`, `aiws-reconcile`) | **`aiws:*`** (`aiws:core`, `aiws:sdd`) | this generator |
| Org overlay | `corp-<handle>-*` | `corp-<handle>:*` | the company/freelancer |
| Third-party | unprefixed (find-skills ecosystem) | — | community |

- **`aiws-*` / `aiws:*` is a reserved namespace.** Org/user packs declaring those ids are **rejected** (lint),
  so the base cannot be impersonated or shadowed by name. (Also fixes the audit's name-collision finding.)
- Every owned artifact carries **provenance**: `source: aiws@<TEMPLATES_VERSION>` or `source: corp-acme@<packver>`
  + a content **hash**, recorded in a generated manifest (Part E). Extends today's frontmatter `version`/`author`.

### Part C — Overlay relation (the auditable primitive)

The missing primitive that makes upgrades tractable: **each org unit declares its relation to the base** in its
`pack.yaml`:

```yaml
relation: extends                 # adds to the base, touches nothing of ours
# or
relation: overrides
  target: aiws-sdd                # replaces this specific base unit (must exist)
# or
relation: new                     # a capability with no base equivalent
```

An override targeting a non-existent or non-`aiws` id is **rejected**. With this declaration, a base update is
**mechanically auditable** (we know which base id each override tracks).

### Part D — Extension & upgrade model (consume the base; keep your stuff in a git pack)

Companies do **not** fork the tool. They:

1. **Consume the base as a versioned dependency** — install/`npx` a pinned `ai-workspace@<version>`. Upgrading =
   bump the version, not a code merge.
2. **Keep their content in a separate company pack — a git repo** (`config.company.packs: [git+https://…acme-iaws-pack#<ref>]`).
   Formalises today's `skill-packs/corp-<x>-<org>/` extension point + `ai-workspace skills sync` vendoring, with a
   git source. The company owns/versions it in **their** repo.
3. **Upgrade flow:** `ai-workspace upgrade --check` (diff) → `ai-workspace upgrade` regenerates only `aiws:*`
   regions (idempotent; `corp-<handle>:*` regions are never touched — `writeManaged` never deletes unknown ids) →
   **`aiws-reconcile`** audits the org pack against the new base.

**Fork is the edge case, not the default.** Only when a company must change the **base itself** (or air-gapped /
compliance ownership) do they fork the generator — and the same provenance separation makes `git merge upstream`
**conflict-free in the base** (their changes live in `corp-*`/override layers, never inside `aiws:*` regions).

### Part E — Integrity safeguards (detect · self-heal · confine · warn — not a lock)

Honest scope: the output is plain files in the user's repo; we cannot *prevent* edits. We make integrity
**verifiable and restorable**, and catch casual breakage early:

1. **Ownership boundary.** Each `aiws-*` artifact states it is managed; `aiws:begin/end` markers are the boundary
   (inside = ours, regenerated; outside = yours, survives).
2. **Provenance manifest + integrity gate.** A generated `.ai-workspace/manifest.json` (path · source@version ·
   hash · expected block ids). **`aiws-verify` / `doctor --strict`** recomputes and reports tampering, orphaned/renamed
   markers, in-region drift, unexpected deletions — **non-zero exit → CI gate**.
3. **Self-healing.** `sync` restores any base artifact to canonical; `sync --check` warns before overwriting so
   no work is lost silently.
4. **Confinement.** Config validated by schema at the boundary; reserved `aiws-*` namespace; overlays must declare
   a valid `relation` — out-of-place or impersonating edits are rejected.
5. **Authoring-time guard.** The existing `safetyGuard` PreToolUse hook is extended to warn/block edits to
   manifest-listed base files (Claude Code only).

### Part F — Reconciliation skill (`aiws-reconcile`)

A first-class, **propose-and-review** skill that generalises today's `/sdd-upstream-check` + `skills sync` diff to
**base ↔ org overlay**. On a base upgrade it classifies each org unit: 🟢 **redundant** (now in base → propose
removal) · 🟡 **conflict** (clashes with new base → user decides) · 🔵 **unique** (keep) · ⚠️ **drift** (out-of-band
base edit). Never auto-edits (Safety gate).

## Status

**Implemented** across changes 0013 (F1 namespacing + provenance + migration), 0014 (F2a–c: pack namespace +
`relation` + git company packs + reserved-namespace guard), and 0015 (F3 integrity manifest + `verify` + self-heal
+ confine). Part F (`aiws-reconcile`) ships as a CLI (`ai-workspace reconcile`) + a propose-and-review skill.
`TEMPLATES_VERSION` reached 0.46.0. Remaining: dogfooding the foundations onto this repo + a release (end-of-line).

## Boundary (what this ADR did NOT do at authoring time)

- It did **not** itself implement the manifest, `aiws-verify`, `aiws-reconcile`, the git pack source, the relation
  lint, or the `aiws-`/`corp-<handle>` rename — those landed as the scoped changes above.
- It did **not** change any generated artifact at authoring time → `TEMPLATES_VERSION` unchanged then.
- The `aiws-`/`aiws:` **rename is a deliberate id migration** of a stable contract (ADR 0002 Part A): it ships with
  an updated golden + a migration map + a note in [MAINTAINING](../MAINTAINING.md), in one change.

## Open questions (for the implementing changes)

- Manifest location/format (`.ai-workspace/manifest.json` vs a lockfile) and whether it is committed.
- Company-pack resolution mechanics for git sources (pin by tag/sha; offline cache; auth for private repos).
- Whether `aiws-reconcile` runs standalone or is folded into `upgrade`/`doctor`.
- Migration ergonomics for existing repos already on unprefixed ids (auto-rewrite on `upgrade`).

## Consequences

- The chaos collapses into **three declarations** — *one tenant always*, *provenance prefix*, *overlay relation* —
  plus a verify/reconcile pass. Identifiable, versioned, explicitly related → maintainable by an AI or a person.
- 0012 gets **easier**: generated SDD skills are born as `aiws-*` with provenance and clean triggers, ending the
  name collision.
- Distribution clarifies: **primary path** = `npx init` → plain files + `add`; the Claude plugin/marketplace is
  **optional, enterprise-only**, demoted in docs/UI (own ADR).
- Every governance update across a fleet becomes a versioned dependency bump + a reconcile, not a fork merge.
