---
name: aiws-sdd-explore
description: >
  Investigate a feature or bug before committing to an approach: frame the problem, survey the relevant code, and lay out options with trade-offs. Use at the very start of a non-trivial change, when the problem or solution space is still unclear.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.46.0
  version: "1.0"
---

## aiws-sdd-explore

Clarify the problem, survey the code, list open questions and options. Write findings to the change's `explore.md`.

## Read first
- the request / issue
- the relevant modules and their tests
- related prior changes in the archive

## Produce — `explore.md`
- Problem (grounded in the code)
- Current reality
- Open questions
- Options with trade-offs
- Recommendation

## Quality bar
- [ ] Claims cite real files/symbols, not assumptions
- [ ] At least two options weighed
- [ ] Open questions are explicit, not glossed over

## How to work
1. Read the prior artifacts in the change folder before writing `explore.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/sdd-convention.md`.
