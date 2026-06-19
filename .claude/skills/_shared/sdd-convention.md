# SDD store convention (shared)

SDD artifacts are plain markdown, versioned in git, readable by any AI tool. Follows OpenSpec's
*layout* (specs + changes + archive) as a convention — no external CLI.

Layout:
- `docs/development/specs/`            — stable specifications (the current truth)
- `docs/development/changes/<name>/`   — an in-flight change
  - `explore.md`  · investigation and options
  - `proposal.md` · intent, scope, approach, risks
  - `spec.md`     · requirements + acceptance scenarios (WHAT)
  - `design.md`   · technical design + Mermaid diagrams (HOW)
  - `tasks.md`    · ordered checklist (progress)
  - `verify-report.md` · validation against the spec
- `docs/development/changes/archive/`  — completed changes

Rules:
- One change folder per logical change. Keep the spec as the source of truth for behavior.
- Archive a change only after verify passes; fold its delta into `docs/development/specs/`.
