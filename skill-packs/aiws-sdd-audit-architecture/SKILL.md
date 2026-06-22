---
name: aiws-sdd-audit-architecture
description: >
  Audit the project layout/architecture against the canonical layouts (LAYOUTS + CONV-STRUCT). Trigger: architecture review.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-audit-architecture — architecture audit (LAYOUTS + CONV-STRUCT-*)

Verify the project layout matches the canonical layout for `{profile, flags}` and the structural
conventions. The full `LAYOUTS.md` map and `TECH_STACK_*` §layout sections are an external reference (supply your own; not bundled here).

### Checks
- Layout matches `{profile, flags}` (A-api-only / A-with-UI / B-static / B-bundled / B-react / B-node-server).
- Profile A layering present (domain / application / infrastructure / interfaces) per CONV-STRUCT.
- §4.2 of the spec (File and folder layout) conforms to the chosen layout's minimums and code roots.
- UI apps scaffold `templates/` + `static/` (A-with-UI) or `index.html` entry (Profile B).

### Output
A report mapping the actual tree to the canonical layout, flagging missing minimums or misplaced roots.
