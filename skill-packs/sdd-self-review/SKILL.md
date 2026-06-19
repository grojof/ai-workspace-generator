---
name: sdd-self-review
description: >
  Run the full pre-handoff validation gauntlet (lint, types, tests, coverage, security, SDD-trail consistency) and emit a PASS/FAIL report citing rule IDs. Trigger: self-check before handoff.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-self-review — pre-handoff validation gauntlet

Run the full validation set **before IT receives the project** and emit a PASS/FAIL report citing rule IDs.
This is the builder-side mirror of the `sdd-audit-*` skills — green here is the precondition for handoff.

### Checks
- **Profile A:** `ruff`, `pyright`, `pytest`, **coverage ≥ 70 % (TECH-A-013)**, a security scan (e.g. bandit),
  dependency CVE + secrets scans.
- **Profile B:** HTML/JS/CSP/SRI checks; npm/React/storage checks when the matching flags are set.
- **Cross-profile:** the `sdd-spec-schema` checklist passes; forbidden-pattern scan; **SDD store consistency**
  — every §5 Operation has code + tests; the change record in `{{paths.changes}}/<change>/` matches what's on disk.

### Output
A report listing each check, PASS/FAIL/N-A, evidence and the rule ID. Anything red is fixed before handoff.
Record the verdict in `{{paths.status}}/PROJECT-STATE.md` and the change-folder. Hand off to `sdd-handoff`.
