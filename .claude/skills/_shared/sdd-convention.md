# SDD store convention (shared)

SDD artifacts are plain markdown, versioned in git, readable by any AI tool. Follows OpenSpec's
*layout* (specs + changes + archive) as a convention — no external CLI.

Layout:
- `docs/development/specs/`            — stable specifications (the current truth)
- `docs/development/changes/<name>/`   — an in-flight change
  - `explore.md`  · investigation and options
  - `proposal.md` · intent, scope, approach, risks
  - `clarify.md`  · questions + decisions that resolve ambiguity before the spec
  - `spec.md`     · requirements + acceptance scenarios (WHAT)
  - `design.md`   · technical design + Mermaid diagrams (HOW)
  - `tasks.md`    · ordered checklist (progress)
  - `verify-report.md` · validation against the spec
- `docs/development/changes/archive/`  — completed changes

Rules:
- One change folder per logical change. Keep the spec as the source of truth for behavior.
- Archive a change only after verify passes; fold its delta into `docs/development/specs/`.

## Delta spec format (OpenSpec)

A change's `spec.md` is a **delta** against the current `docs/development/specs/`, not a full rewrite. Use the three
delta headers, and under each a requirement + at least one scenario:

```markdown
## ADDED Requirements
### Requirement: <name>
The system MUST … (RFC 2119: MUST/SHALL · SHOULD · MAY)
#### Scenario: <name>
- GIVEN <state> WHEN <action> THEN <outcome> AND <…>

## MODIFIED Requirements
### Requirement: <name>            (Previously: <old behaviour>)

## REMOVED Requirements
### Requirement: <name>            (Reason: <…>)
```

- Mark anything still open inline with `[NEEDS CLARIFICATION: <question>]` — resolve before sign-off.
- Add measurable **Success Criteria** (`SC-001…`).

## Archive merge rules

When archiving (after verify passes), fold the delta into `docs/development/specs/` deterministically, then move the
change folder to `docs/development/changes/archive/<date-name>/` preserving its full context:

- **ADDED** → append the requirement to the matching domain spec.
- **MODIFIED** → replace the existing requirement's body.
- **REMOVED** → delete the requirement.

## Evaluating a skill (the quality bar in practice)

Each phase skill ships a **Quality bar** checklist — that is its eval rubric. Before moving on, judge the
artifact against it with 2–3 quick scenarios rather than a vague "looks good":

- **Typical** — a normal change: does the artifact pass every quality item?
- **Edge** — a thin or ambiguous input: are gaps named (e.g. `[NEEDS CLARIFICATION]`) instead of guessed?
- **Anti** — a tempting shortcut (skipping clarify, HOW in the spec, gold-plating the design): is it caught?

If an artifact fails its quality bar, fix the artifact (or the upstream phase) before proceeding — the bar is
the contract, not a suggestion.
