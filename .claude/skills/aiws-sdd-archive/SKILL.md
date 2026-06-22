---
name: aiws-sdd-archive
description: >
  Fold a verified change's delta into the stable specs and move its folder to the archive. Use only after verify passes: ADDED requirements are appended, MODIFIED replace, REMOVED delete; then the change is archived with its full history.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.51.0
  version: "1.0"
---

## aiws-sdd-archive

Merge the delta spec into the stable specs, then move the change folder to the archive.

## Read first
- verify-report.md (must pass)
- spec.md delta
- the target `specs/` baseline

## Produce — `specs/ (updated) + archive/<date-name>/`
- Apply delta: ADDED→append, MODIFIED→replace, REMOVED→delete
- Move the change folder to the archive (full context preserved)

## Quality bar
- [ ] Verify passed before archiving
- [ ] Delta merge rules applied exactly
- [ ] Stable specs remain internally consistent after merge

## How to work
1. Read the prior artifacts in the change folder before writing `specs/ (updated) + archive/<date-name>/`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/aiws-sdd-convention.md`.
