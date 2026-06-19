---
name: sdd-verify
description: >
  Validate implementation against spec. Trigger: when planning/executing the verify phase of a Spec-Driven Development change.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---

## sdd-verify

Check each requirement/scenario; report gaps in the change's `verify-report.md`.

## How to work
- Read prior artifacts in the change folder before writing the next one.
- Artifacts live in `docs/development/changes/<change>/` and are versioned in git.
- Follow the SDD lifecycle and conventions in AGENTS.md and `_shared/sdd-convention.md`.
