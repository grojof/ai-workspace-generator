---
name: aiws-sdd-apply
description: >
  Implement the tasks in order, keeping the code aligned with the spec and design, checking each off as it lands. Use to execute an agreed plan — if reality diverges from the spec, stop and update the spec first.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.50.0
  version: "1.0"
---

## aiws-sdd-apply

Implement tasks in order, checking them off in `tasks.md`. Keep code aligned with the spec.

## Read first
- tasks.md
- spec.md
- design.md

## Produce — `tasks.md (kept current)`
- Tasks checked off as completed
- Notes on any deviation (with the spec updated to match)

## Quality bar
- [ ] Code matches the spec — divergence updates the spec, not silently the code
- [ ] Tests accompany behaviour
- [ ] Each task checked off only when actually done

## How to work
1. Read the prior artifacts in the change folder before writing `tasks.md (kept current)`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/aiws-sdd-convention.md`.
