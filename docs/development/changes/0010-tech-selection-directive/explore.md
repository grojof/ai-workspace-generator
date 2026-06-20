# Exploration: 0010 — greenfield technology-selection directive (idempotent)

> Status: exploration. No code touched.

## Goal

When creating a **new** project with no tech present, the AI must not grab the first technology it thinks of.
It must **explore coherent options** across language / framework / environment **and the production target**,
explain trade-offs and *why* one over another, recommend, and await the decision. This is the most important
moment of a new workspace, so it must be a **standing, idempotent directive** (always present in AGENTS.md).
The chosen stack + dev environment + production target + rationale must be **documented in project context**
(new and existing projects). And responses should offer a terse "say X and I'll explain X" instead of dumping
long explanations.

## Current State

- AGENTS.md is composed from ordered **managed blocks** via `BLOCK_MANIFEST`
  ([src/generate/blockManifest.ts:75-99](../../../../src/generate/blockManifest.ts)); a block = a `.eta` in
  `templates/` + a stable id. Adding a block is **additive** (new entry + new id), pinned by
  `test/invariants.test.js`.
- The **versioning** block says new projects use "current stable versions" but nothing tells the AI to
  **choose** the stack/production target deliberately with options + rationale.
- **Living docs** capture state (`templates/living-docs/section.md.eta`, `PROJECT-STATE.md`) but there's no
  enforced **"Stack & production target decision"** record (what was chosen and why).
- No convention for the **terse-offer** style ("dime X y te explico X") to curb output bloat.

## Affected Areas

- `templates/core/tech-selection.md.eta` (new) + new `BLOCK_MANIFEST` entry (id e.g. `tech-selection`), gated to greenfield (`mode === "new"` or empty stack).
- `src/generate/blockManifest.ts` — register the block (and update the order contract test intentionally).
- `templates/living-docs/section.md.eta` (or doc-sync) — add a **"Stack & production target decision"** section to `PROJECT-STATE.md`.
- `templates/core/conventions.md.eta` (or routing) — one line for the **terse-offer** convention.
- `src/version.ts` — bump `TEMPLATES_VERSION` (generated output changes).
- `test/invariants.test.js` — update block list.

## Approaches

1. **New gated managed block + living-docs decision record + terse-offer line.** The directive: for greenfield
   / empty stack, present 2-3 *coherent* stack options (language↔framework↔environment that fit together) **and**
   the production target (where it runs: serverless, container, VM, edge, desktop, mobile…), each with
   pros/cons/risks + a recommendation; **await the user's choice**; then record the decision (stack + dev env +
   prod target + rationale) in `PROJECT-STATE.md`. Add the terse-offer convention.
   - Pros: exactly the idempotent, always-present directive requested; right altitude; additive/stable.
   - Cons: new permanent block id (contract); must keep token budget lean.
   - Effort: Low-Medium.
2. **Fold into the existing versioning/workflow block** (no new block).
   - Pros: no new id. Cons: muddies a block that's about versions; weaker signal; harder to gate to greenfield.
   - Effort: Low.
3. **Skill instead of a block** (`tech-selection` skill).
   - Pros: loads on demand. Cons: not *always present* — the user explicitly wants a standing directive. Reject.

## Recommendation

**Option 1.** A new greenfield-gated `tech-selection` block carries the idempotent directive; the living-docs
template gains a **Stack & production target decision** record (applies to new *and* existing projects so the
context is complete); core conventions gain the one-line **terse-offer** rule. Gate the block to greenfield so
existing repos aren't nagged, but keep the decision-record section for all projects.

## Risks

- **Permanent block id** — additive and safe, but never rename/remove later (managed-region contract).
- **Block-order test** must be updated deliberately (it's the contract, not an accident).
- **Token budget** — `doctor` lints budgets; keep the block concise (it's a directive, not a tutorial).
- **Greenfield gating** — pick the trigger (`mode === "new"` OR empty stack) so the directive appears exactly when there's a real choice to make.

## Ready for Proposal

**Yes.** Independent of the others (touches generated templates). Propose around Option 1.
