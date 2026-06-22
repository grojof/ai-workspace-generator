---
name: aiws-sdd-clarify
description: >
  Surface and resolve ambiguity before the spec is written: ask targeted questions about underspecified behaviour, edge cases and decisions, and record the answers. Use between proposal and spec whenever the proposal leaves choices open.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.52.0
  version: "1.0"
---

## aiws-sdd-clarify

Ask targeted questions about underspecified areas and record the decisions in the change's `clarify.md`, so the spec that follows is unambiguous. (Idea borrowed from Spec-Kit.)

## Read first
- proposal.md
- explore.md
- any `[NEEDS CLARIFICATION]` markers

## Produce — `clarify.md`
- Questions (each with options + a recommendation)
- Decisions (the chosen answer + why)

## Quality bar
- [ ] Each question changes what the spec would say
- [ ] Decisions are concrete enough to remove the ambiguity
- [ ] No open `[NEEDS CLARIFICATION]` left for the spec

## How to work
1. Read the prior artifacts in the change folder before writing `clarify.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/aiws-sdd-convention.md`.
