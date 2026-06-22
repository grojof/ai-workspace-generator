---
name: aiws-sdd-tasks
description: >
  Break the spec and design into an ordered, checkable task list — small, verifiable steps that map back to requirements. Use once spec and design are agreed, to drive (and track) implementation.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.46.0
  version: "1.0"
---

## aiws-sdd-tasks

Derive an ordered checklist from spec + design into the change's `tasks.md`.

## Read first
- spec.md
- design.md

## Produce — `tasks.md`
- Ordered tasks (checkboxes)
- [P] markers for parallelizable work
- Each task traces to a requirement

## Quality bar
- [ ] Tasks are small and independently verifiable
- [ ] Order respects real dependencies
- [ ] Together they cover every requirement

## How to work
1. Read the prior artifacts in the change folder before writing `tasks.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/sdd-convention.md`.
