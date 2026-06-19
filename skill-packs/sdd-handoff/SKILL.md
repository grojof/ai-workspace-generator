---
name: sdd-handoff
description: >
  Package a finished REASONS project for IT review — verify a READY self-review, write a handoff README (versions, install/run/test, TODOs), optional clean ZIP. Trigger: app ready for IT.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-handoff — package for IT review

Package a finished project so the IT reviewer can audit it. **Refuse** if a recent `sdd-self-review` verdict
is not READY, or if required pieces are missing.

### Produces
- A `HANDOFF_README.md`: profile, dependency/tool versions, install/run/test commands, outstanding TODOs,
  contact. (No live deploy — IT performs the deployment.)
- Optionally a clean ZIP of the project (source + tests + spec + the change record).
- A short message drafting the handoff to IT.

### Store
The handoff bundle references the spec in `{{paths.specs}}/` and the process trail in `{{paths.changes}}/<change>/`
— all Git-versioned. On the IT side, suggest the `sdd-audit-*` reviewer skills, then the `it-approved`
status transition once every audit is green.
