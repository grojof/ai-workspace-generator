# Design — Greenfield technology-selection directive (idempotent)

## Overview

Add a greenfield-gated managed block that forces deliberate stack + production-target selection, a living-docs
decision record, and a terse-offer convention. Additive only (new stable block id); no schema change.

## Changes

### 1. New block template — `templates/core/tech-selection.md.eta`
Greenfield directive (English, AI-facing, lean for the token budget): clarify constraints → determine the
**production target** (where it runs: serverless/container/VM/edge/PaaS/on-device) → present 2-3 *coherent*
options (language ↔ framework ↔ runtime + target) with pros/cons/risk → recommend → **await the user's
decision** (Safety gate, never silent) → record the decision in `PROJECT-STATE.md` and run `ai-workspace add …`
to materialize the layers. Use **context7** for version facts. Ends with the terse-offer reminder.

### 2. Register the block — `src/generate/blockManifest.ts`
Insert between `skill-routing` (render) and the language `expand`:
```
{ kind: "template", id: "tech-selection", template: "core/tech-selection.md.eta",
  when: (c) => c.project.mode === "new" && c.stack.languages.length === 0 && c.stack.frameworks.length === 0 }
```
- Greenfield-only gate → existing repos and already-configured greenfield repos don't get it.
- Position after `skill-routing` keeps the fixed Layer-0 prefix (first nine ids) intact, and places the
  directive where the per-stack layers would otherwise be (you choose the stack *before* it has layers).

### 3. Living-docs decision record — `templates/living-docs/section.md.eta`
Extend the `PROJECT-STATE.md` bullet to include "**stack & production-target decision (what + why)**" so every
project (new and existing) records the choice.

### 4. Terse-offer convention — `templates/core/conventions.md.eta`
Add one bullet under "Token efficiency": offer "say **X** and I'll explain X" instead of long unsolicited detail.

### 5. Version + tests
- Bump `TEMPLATES_VERSION` in `src/version.ts` (generated output changes). Use **0.34.0** (change 0009, still
  in flight, took 0.33.0) — resolve to the higher value if a version.ts merge conflict appears.
- `test/invariants.test.js`: the existing block-order golden is a `mode: new` repo **with a stack**, so it is
  unchanged (gate excludes it). Add a focused test: greenfield empty-stack ⇒ `tech-selection` present right
  after `skill-routing`; `mode: existing` ⇒ absent; `mode: new` + stack ⇒ absent.

## Why this approach
- A standing block (not a skill) satisfies "always present". Greenfield gating avoids nagging.
- Additive id honors the managed-region contract; position chosen to preserve the pinned prefix and the
  existing golden, minimizing contract churn.

## Risks / mitigations
- **Permanent block id** — additive; never rename/remove later.
- **Token budget** — keep the block concise; greenfield repos only (and this repo is `existing`, so its own
  `doctor` is unaffected).
- **version.ts merge conflict with 0009** — trivial; resolve to the higher number.
- **Idempotency** — no logic change beyond manifest registration; covered by the idempotency invariant tests.
