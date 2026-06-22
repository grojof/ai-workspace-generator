---
name: aiws-sdd-design
description: >
  Decide HOW the spec is met: the technical approach, the key architecture decisions and their trade-offs, with Mermaid diagrams where they clarify. Use after the spec is stable, before breaking work into tasks.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.46.0
  version: "1.0"
---

## aiws-sdd-design

Capture HOW in the change's `design.md`, with Mermaid diagrams where useful.

## Read first
- spec.md
- the existing architecture (`ARCHITECTURE.md`) and affected modules

## Produce — `design.md`
- Approach
- Architecture decisions (option chosen + why)
- Diagrams (Mermaid, quoted labels)
- Data / contracts
- Trade-offs & complexity

## Quality bar
- [ ] Every spec requirement is covered by the design
- [ ] Decisions record the rejected alternatives
- [ ] Diagram labels with special chars are quoted
- [ ] No gold-plating beyond the spec

## How to work
1. Read the prior artifacts in the change folder before writing `design.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/sdd-convention.md`.
