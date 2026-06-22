---
name: aiws-sdd-propose
description: >
  Turn an explored idea into a reviewable proposal: state the why, the scope (in and out), the approach, and the risks. Use once exploration converges and before writing the spec — it is the decision artifact a reviewer signs off.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.47.0
  version: "1.0"
---

## aiws-sdd-propose

State intent, scope, approach and risks in the change's `proposal.md`.

## Read first
- explore.md
- the constitution / AGENTS.md guard-rails

## Produce — `proposal.md`
- Why
- What (scope: in / out)
- Approach
- Decisions to confirm
- Risks

## Quality bar
- [ ] Scope boundaries are explicit (what it will NOT do)
- [ ] Any plausible-alternative decision is surfaced, not assumed
- [ ] Risks name a mitigation

## How to work
1. Read the prior artifacts in the change folder before writing `proposal.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/sdd-convention.md`.
