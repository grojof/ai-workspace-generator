# Spec — Guided config: never silently infer the profile

Requirements use MUST/SHOULD; each has acceptance scenarios. Delta against current `init`/wizard behavior.

## R1 — Detection seeds stack, never governance profile
Stack detection MUST NOT set `userType` or `experience`. Those are an explicit user choice in every path.

- **Given** a repo with a detected stack, **when** the Simple wizard runs, **then** it **asks** the user type
  and experience (it does not assume "technical").
- **Given** an empty repo, **when** the Simple wizard runs, **then** it **asks** the user type and experience
  (it does not assume "business").
- **Given** `simpleDefaults(detected, basics)`, **when** called, **then** `userType`/`experience` come from
  `basics`, not from whether a stack was detected.

## R2 — Advanced profile defaults are detection-independent
The Advanced wizard MUST NOT key the `userType` prompt's default off detection.

- **Given** the Advanced wizard, **when** the user-type prompt appears, **then** its default is a fixed neutral
  value (not `detectedExisting ? technical : business`), with a hint that detection doesn't decide this.
- Project `mode` (new/existing) MAY still default from detection (a repo with code is genuinely existing).

## R3 — Simple stays lean
The Simple path MUST add at most two new prompts (user type, experience) and keep smart defaults for everything
else.

- **Given** Simple mode, **when** it runs, **then** the user answers name, docs language, targets, **user type,
  experience** — and the rest uses documented defaults.

## R4 — `/configure` is a complete, explained guided path
The generated `configure-workspace` skill MUST walk **every** config option with a one-line rationale, and MUST
instruct the agent to **ask the profile, not guess** it.

- **Given** the generated skill, **when** read, **then** it covers targets, profile (userType×experience),
  project mode, stack, SDD (enabled/backend/methodology), safety guard, vscode, context7, company, and
  languages/frameworks/environments — each with a short "why".
- **Given** an empty repo, **when** the agent drives `/configure`, **then** the skill tells it to ask the
  profile explicitly rather than infer it.
- **Given** `init` finishes, **then** it points to `/configure` as the richest path.

## R5 — No config-shape change (idempotency preserved)
This change MUST NOT alter the `workspace.config.yaml` schema.

- **Given** an existing config, **when** parsed/generated after this change, **then** it behaves identically
  and a second `sync` reports 0 created / 0 updated.

## Out of scope
- A full interactive AI handoff launched from `init`.
- Any schema/field additions.

## Acceptance summary
No code path sets `userType`/`experience` without a user choice; Simple asks them (≤2 prompts); Advanced
defaults don't depend on detection; the `/configure` skill explains every option and mandates asking the
profile. Schema unchanged; tests + idempotency green.
