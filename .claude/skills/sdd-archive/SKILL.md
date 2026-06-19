---
name: sdd-archive
description: >
  Fold the change into main specs and archive. Trigger: when planning/executing the archive phase of a Spec-Driven Development change.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---

## sdd-archive

Merge the delta spec into the stable specs, then move the change folder to the archive.

## How to work
- Read prior artifacts in the change folder before writing the next one.
- Artifacts live in `docs/development/changes/<change>/` and are versioned in git.
- Follow the SDD lifecycle and conventions in AGENTS.md and `_shared/sdd-convention.md`.
