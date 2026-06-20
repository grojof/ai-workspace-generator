# Spec — Greenfield technology-selection directive (idempotent)

Requirements use MUST/SHOULD. Adds a generated managed block + living-docs record + a convention line.

## R1 — Standing greenfield tech-selection block
A new managed block MUST instruct the AI, on a greenfield project with no stack, to explore options before
choosing — covering language/framework/environment **and the production target**.

- **Given** a config with `mode: new` and no languages/frameworks, **when** `AGENTS.md` is generated, **then**
  it contains a `tech-selection` block that tells the AI to: clarify constraints, determine the production
  target, present 2-3 coherent options with pros/cons/risk, recommend one, and **await the user's decision**.
- **Given** the block, **then** it forbids locking in a stack silently (Safety gate) and points to recording
  the decision and using `ai-workspace add` to materialize it.

## R2 — Greenfield gating (don't nag configured/existing repos)
The block MUST appear only when there is a real choice to make.

- **Given** `mode: existing`, **then** the block is absent.
- **Given** `mode: new` but a stack already has languages or frameworks, **then** the block is absent.
- **Given** `mode: new` with an empty stack, **then** the block is present, **after** `skill-routing` and
  **before** the per-stack layers; the fixed Layer-0 prefix (first nine block ids) is unchanged.

## R3 — Decision recorded in living docs (new & existing)
The living-docs block MUST call out a **Stack & production target decision** record in `PROJECT-STATE.md`,
applicable to every project (so the context is complete, not just greenfield).

- **Given** `livingDocs: true`, **when** generated, **then** the living-docs block lists a "stack & production
  target decision (what + why)" entry for `PROJECT-STATE.md`.

## R4 — Terse-offer convention
The universal conventions MUST include a one-line rule to **offer** an explanation ("say X and I'll explain X")
instead of dumping long unsolicited detail.

## R5 — Stable, additive contract; idempotency preserved
Adding the block MUST be additive (new stable id, never reorder/rename existing ids) and MUST NOT break
idempotency.

- **Given** any config, **when** generated twice, **then** the second run reports 0 created / 0 updated.
- **Given** the block-order golden (a configured `mode: new` repo with a stack), **then** it is unchanged
  (the block is gated out when a stack exists).

## Out of scope
- A loadable skill (must be always-present → a block, not a skill).
- Auto-selecting any stack without the user's decision.

## Acceptance summary
A greenfield, stackless `AGENTS.md` carries an always-present tech-selection directive (options + production
target + await decision, Safety gate); living docs record the stack/prod-target decision; conventions gain the
terse-offer rule. Block ids stay a stable, additive contract; idempotency + doctor green.
