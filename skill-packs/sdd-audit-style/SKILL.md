---
name: sdd-audit-style
description: >
  Audit code style/conventions against a catalogue of engineering conventions (CONV-*). Trigger: style review.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-audit-style — conventions audit (CONV-*)

Audit naming, structure, docstrings, logging, error handling, tests and branding against a catalogue of
engineering conventions. Cite findings by control ID. The full `CONV-*` catalogue is an external
reference (supply your own; not bundled here).

### Areas (by category)
- **CONV-PY / CONV-JS** — language conventions: naming, imports, function size, docstrings.
- **CONV-STRUCT** — module/folder structure for the chosen layout.
- **CONV-LOG** — structured logging; no secrets in logs.
- **CONV-DOC** — documentation and the operational trail (CONV-DOC-004 reading precedence; CONV-DOC-005
  user-manual link for UI apps; CONV-DOC-006 UI mockups).
- **CONV-TEST** — test naming and the §5 Operations → test mapping.
- **CONV-BRAND** — UI apps apply the brand layer (CONV-BRAND-001/002) when `apply_branding: true`.
- **CONV-NODE** — Node-server Profile B specifics (CONV-NODE-001/002).

### Output
A report by category with PASS/FAIL and the file/line. "No invented norms": only cite IDs that exist in
the catalogue; new norms go to the catalogue via a separate change.
