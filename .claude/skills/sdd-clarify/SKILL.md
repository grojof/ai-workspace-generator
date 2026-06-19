---
name: sdd-clarify
description: >
  Resolve ambiguities before writing the spec. Trigger: when planning/executing the clarify phase of a Spec-Driven Development change.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---

## sdd-clarify

Ask targeted questions about underspecified areas and record the decisions in the change's `clarify.md`, so the spec that follows is unambiguous. (Idea borrowed from Spec-Kit.)

## How to work
- Read prior artifacts in the change folder before writing the next one.
- Artifacts live in `docs/development/changes/<change>/` and are versioned in git.
- Follow the SDD lifecycle and conventions in AGENTS.md and `_shared/sdd-convention.md`.
