---
name: aiws-sdd-verify
description: >
  Validate the implementation against the spec: walk every requirement and acceptance scenario, run the checks, and report any gaps. Use after apply, before archiving — it is the evidence the change is actually done.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.51.0
  version: "1.0"
---

## aiws-sdd-verify

Check each requirement/scenario; report gaps in the change's `verify-report.md`.

## Read first
- spec.md (requirements + scenarios)
- the implemented code and its tests

## Produce — `verify-report.md`
- Per-requirement result (pass / fail / partial)
- Evidence (tests, output)
- Gaps and follow-ups

## Quality bar
- [ ] Every requirement and scenario is checked
- [ ] Failures are reported honestly with the evidence
- [ ] No requirement marked done without proof

## How to work
1. Read the prior artifacts in the change folder before writing `verify-report.md`.
2. Fill the section template above; keep it concise and high-signal.
3. Self-check against the quality bar before moving to the next phase.

> Artifacts live in `docs/development/changes/<change>/` and are versioned in git. Follow the SDD lifecycle in AGENTS.md and `_shared/aiws-sdd-convention.md`.
