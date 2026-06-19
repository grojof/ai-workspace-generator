# Spec — Guided configuration UX (Phase 1 + multi-repo schema)

Scope of this spec: **Phase 1** (AI-guided analysis of an existing project) and the **multi-repo schema**
foundation. Phases 2–4 (de-hardcode refactor, simple/advanced wizard, full multi-repo build) get their own
specs later. Requirements use MUST/SHOULD; each has acceptance scenarios.

## R1 — Registry is the single source of stack options
The wizard, the analysis skill, and docs MUST read languages/frameworks/environments/MCPs from
`src/modules/registry.ts` (no duplicated hardcoded lists in `init.ts`).

- **Given** a new language is added to `registry.ts`, **when** `init` runs, **then** it appears as an option
  without editing `init.ts`.
- **Given** the analysis skill proposes a stack, **when** it names modules, **then** every id it uses exists
  in the registry (or is flagged as "needs a new module").

## R2 — `configure-workspace` skill: analyze an existing repo
A new skill MUST let the agent analyze an existing repository and produce a **proposed** configuration
without writing anything until approved.

- **Given** a repo with a `package.json` + `tsconfig.json`, **when** the skill runs, **then** it reports the
  detected stack (languages/frameworks/environments) seeded by `detectStack`, plus anything the deterministic
  detector missed (enriched by the agent).
- **Given** detection finds no known stack, **when** the skill runs, **then** it asks the user targeted
  questions instead of guessing.
- **Given** the analysis completes, **then** the skill presents a proposed `workspace.config.yaml` (as a
  preview/diff) and the rationale per section, and does **not** write it until the user approves.

## R3 — Gap detection + skill proposals
The skill MUST detect capability gaps and propose skills to fill them, using the existing ecosystem.

- **Given** the repo uses a framework with no matching bundled module/pack, **when** the skill runs, **then**
  it proposes either adding a registry module or discovering a pack via `find-skills`, and explains the choice.
- **Given** a proposed skill set, **when** the user approves, **then** only the approved skills are wired.

## R4 — Conflict & structure safety (propose-and-review)
The skill MUST surface conflicts with existing files/paths and MUST NOT move or overwrite user files
automatically.

- **Given** existing docs/paths that would collide with generated structure, **when** the skill runs,
  **then** it lists the conflicts and proposes a folder alignment as a reviewable plan.
- **Given** a proposed folder reorganization, **then** it is applied only after explicit approval (Safety
  gate); declining leaves the repo untouched.

## R5 — Safe application
Applying the approved configuration MUST be idempotent and MUST preserve user content.

- **Given** an approved config, **when** the skill writes `workspace.config.yaml` and runs `generate`,
  **then** a second run reports 0 created / 0 updated.
- **Given** user prose outside managed markers, **when** generation runs, **then** it survives unchanged.

## R6 — Multi-repo schema (additive, non-breaking)
The config schema MUST accept an optional `repos[]` describing a workspace that governs more than one repo,
without breaking single-repo configs.

- **Given** an existing single-repo `workspace.config.yaml` (no `repos`), **when** it is parsed, **then** it
  validates unchanged and behaves exactly as today.
- **Given** a config with `repos: [{ path, stack? }, …]`, **when** it is parsed, **then** it validates and
  exposes a normalized shape where single-repo and multi-repo share the same internal representation.
- **Given** a multi-repo config, **when** the schema normalizes it, **then** each repo has a resolvable path
  and an effective stack (own `stack` or the root default).

> Note: this spec only requires the schema to **accept and normalize** `repos[]`. Per-repo generation and
> distribution are out of scope here (later phases).

## R7 — Modes (direction, specified for later phases)
The system SHOULD offer an AI-guided path as the default and a fully-parametrized manual path as a fallback.
(Full wizard split is Phase 3; this spec only fixes the principle so Phase 1 doesn't preclude it.)

- **Given** no agent/harness is available, **then** the manual wizard remains able to produce a valid config.

## Out of scope (this spec)
- The de-hardcode *refactor* mechanics (Phase 2 — covered by R1 as an outcome, detailed in design).
- The simple/advanced wizard implementation (Phase 3).
- Per-repo generation/distribution for multi-repo (later).
- Re-enabling CI/Dependabot.

## Acceptance summary
A user points the tool at an existing repo → gets an explained, previewed config + skill set + conflict
report → approves → a working, idempotent workspace is generated, with no unapproved file moves. Stack
options come from one registry. The schema accepts `repos[]` without breaking single-repo configs.
