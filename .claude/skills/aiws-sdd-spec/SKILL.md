---
name: aiws-sdd-spec
description: >
  Specify WHAT must be true as a delta against the current specs — testable requirements and acceptance scenarios in the OpenSpec delta format. Use after clarify; the spec, not the code, is the source of truth for behaviour. Avoid HOW (that is design).
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.51.0
  version: "1.0"
---

## aiws-sdd-spec

Capture WHAT must be true in the change's `spec.md`. Requirements with acceptance scenarios.

## Read first
- proposal.md
- clarify.md
- the current `specs/` baseline this change deltas

## Produce — `spec.md`
- Delta headers: `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements`
- Under each: `### Requirement: <name>` stating the rule in RFC 2119 terms (MUST / SHOULD / MAY)
- Each requirement has `#### Scenario: <name>` — GIVEN … WHEN … THEN …
- `[NEEDS CLARIFICATION: …]` inline for anything still open
- Success criteria (measurable, SC-001…)
- Out of scope

## Quality bar
- [ ] Uses the ADDED/MODIFIED/REMOVED delta format against the current `specs/`
- [ ] Every requirement is verifiable and uses an RFC 2119 keyword
- [ ] Each requirement has at least one Given/When/Then scenario
- [ ] No open `[NEEDS CLARIFICATION]` remain; success criteria are measurable; describes WHAT, never HOW

## How to work
1. Read the prior artifacts in the change folder before writing `spec.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/aiws-sdd-convention.md`.
