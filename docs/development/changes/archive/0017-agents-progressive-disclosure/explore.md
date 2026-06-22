# Exploration: 0017 — AGENTS.md progressive disclosure (lean hub + cross-target references)

> Re-opens what change 0016 deferred as "0016c". Goal (maintainer): AGENTS.md should be a **complete Layer-0
> governance hub** that **references** its situational parts, which trigger by context (stack, company, task)
> and load on demand — so the spine stays lean and self-coherent across every target, not crammed until it
> overflows. The token budget is the *symptom*; the right architecture is the *driver*.

## What already exists (half the goal is built)

**Conditional composition** is already done in `BLOCK_MANIFEST`
([src/generate/blockManifest.ts](../../../../../src/generate/blockManifest.ts)): blocks are gated by `when`, so a
repo only gets the blocks its context needs — `company-overlay` only when a company is set, `lang-*`/`fw-*`/
`env-*` expanded per stack entry, `tech-selection` only for greenfield, `sdd`/`living-docs`/`learning` only when
enabled. "Stays clean per context" ✅. What is **not** done: the *detail* of each block is still **inline and
full-text** in AGENTS.md.

## Measured cost (this repo's AGENTS.md, `estimateTokens`)

| Block | tokens | Layer-0 governance (inline) or situational (referencable) |
|-------|-------:|-----------------------------------------------------------|
| `core` | 560 | **inline** — universal conventions |
| `sdd` | 492 | situational — only when doing SDD; **detail already duplicated in the `aiws-sdd-*` skills** (0012a) |
| `routing` | 444 | inline-ish — intent routing (always relevant), but a big table |
| `skill-routing` | 353 | situational — on Claude the skills self-advertise; needed for skill-less targets |
| `safety` | 350 | **inline** — non-negotiable safety gate |
| `workflow` | 331 | **inline** — mandatory dev flow |
| `harness-engineering` | 281 | situational — only when editing the harness |
| `profile` | 226 | inline-ish — governance posture |
| `lang-typescript` | 216 | **situational/path** — applies when editing TS |
| `versioning` | 168 | **inline** — version policy |
| `living-docs` | 161 | situational — only when refreshing docs |
| `header` | 142 | inline |
| `env-node-runtime` | 116 | situational/path |
| `company` / `business` | 108 / 97 | contextual, small |

**Blocks sum ≈ 4045 tokens; the file is 5903.** The ~1858-token gap is **this repo's manual contributor guide
outside the markers** — *not generated*. So: a **consumer's** AGENTS.md is ~4045 here (well under budget); this
repo's pressure is partly self-inflicted by the meta guide, which a block split won't touch. The split is right
for the **product** (consumers), less of a budget fix for *this* repo.

## The hard part: reference mechanisms are per-target (verified in code)

| Target | Reads AGENTS.md? | Native progressive-disclosure mechanism |
|--------|------------------|------------------------------------------|
| **Claude** | via `CLAUDE.md` `@AGENTS.md` import | **Skills** (`.claude/skills`, description-triggered) **+ `@path` imports** |
| **Copilot** | **natively** (root, primary, since late 2025) | **`.github/instructions/*.instructions.md`** with **`applyTo`** glob (path-triggered) — already generated for path-scoped rules (`index.ts:109,208`) |
| **Codex** | **natively** | **nested `AGENTS.md`** per directory (path-triggered) |
| **opencode** | **natively** + reads `.claude/skills` | skills (like Claude) |

So "load by trigger" is **not one mechanism**. Two kinds of detail map to two trigger families:
- **Path/stack-triggered** (`lang-*`/`fw-*`/`env-*` — apply when editing those files): maps *natively* to
  Copilot `applyTo`, Codex nested AGENTS.md, and a Claude skill/reference. Strongest case — `applyTo` already exists.
- **Task/intent-triggered** (`sdd`, `harness-engineering`, `living-docs`, `reconcile`): maps to Claude/opencode
  **skills** (already carry the substance after 0012a). Copilot/Codex have **no description-trigger**, so this
  detail must live in a plain markdown reference the agent reads when the AGENTS.md pointer says so — or stay inline.

**Constraint that bounds everything:** AGENTS.md must stay **self-sufficient for skill-less targets**. Layer-0
governance (`core`, `safety`, `workflow`, `versioning`, `profile`) **stays inline** — hiding it behind a
reference an agent might not open would break governance. Only *situational detail* moves out.

## The universal substrate

The only reference form every target can consume is a **plain markdown file at a known path** + a one-line
pointer-with-trigger in AGENTS.md. Native triggers (Copilot `applyTo`, Claude skills, Codex nested AGENTS.md)
are **projections** layered on top of that same source — exactly the project's existing "one source, many
adapters" model. So a referenced part = one canonical markdown, surfaced into each target's native loader.

## Approaches (detailed in proposal.md)

1. **Stack-detail only** — move `lang-*`/`fw-*`/`env-*` to references + Copilot `applyTo`. Small, low-risk,
   leverages existing machinery. Saves ~330 tokens here.
2. **Full hub + reference substrate** — a `references/` layer mapped to each target's native trigger; move
   stack detail + de-duplicate `sdd`/`harness-engineering`/`living-docs` (their substance already lives in
   skills). Keep Layer-0 inline. Saves ~1000+ tokens. Medium-high risk (single-source contract + every byte
   fixture + the cross-target loader design).
3. **Also reckon with this repo's manual contributor guide** (1858 tokens) — repo-specific, not a generator
   feature; could move to `docs/project/` and leave a pointer.

## Risks

- **Single-source / idempotency contract (high):** references must regenerate idempotently and every byte
  fixture changes — deliberate.
- **Cross-target drift (high):** the same part projected into 4 mechanisms must not diverge — one source, adapters.
- **Governance leakage (critical):** moving a Layer-0 rule to a reference an agent may skip is a safety
  regression. Hard line: governance stays inline.
- **Over-fragmentation (med):** too many tiny references hurt more than a slightly-long spine. Move *blocks*, not sentences.

## Ready for proposal

**Yes.** Recommend **Approach 2, phased**: 2a stack-detail via `applyTo` + references (contained, proves the
substrate); 2b task-detail de-duplication against skills. Layer-0 stays inline. See proposal.md.
