---
name: aiws-audit
description: >
  Produce a prioritized, read-only audit of the workspace's health and coherence (code, docs, integrity, standards) as a dated report. Use periodically or after big changes to surface what to improve. Read-only — it reports and recommends, never fixes.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.50.0
  version: "1.0"
---
## aiws-audit

Produce a periodic, **read-only** self-audit of this workspace and write it as a dated report, so the project
improves from its own state over time. It reports and recommends — it never fixes.

## How to work
1. Gather signals (all read-only):
   - `ai-workspace doctor` — token budget, orphaned blocks, **dangling doc references**, **orphan docs**, stack/MCP registry.
   - `ai-workspace verify` — integrity of base artifacts vs the manifest (tampering / in-region drift).
   - `ai-workspace reconcile` — company overlay vs base (only if a company overlay is configured).
   - Repo health — `git status`/log, the test/lint/build scripts, and the declared `docs.contract`.
2. Synthesize findings into **severity tiers** — 🔴 must-fix · 🟡 should · 🟢 watch — each with *what*, *why it
   matters*, and a **concrete recommendation**. Prioritize **coherence gaps** (the harness preaching standards
   the repo doesn't meet) and **drift**, since those are what silently rot.
3. Write the report to `docs/development/audits/<YYYY-MM-DD>-audit.md` (dated, so improvements compound across
   audits). Link the previous report so progress is visible.
4. Present the top findings and **propose** next steps. Make **no** changes here — fixes go through the normal
   flow (SDD for non-trivial, `doctor`/`sync` for coherence) with the user's approval.

## Quality bar
- [ ] Every finding is evidence-backed (a command output or a `file:line`), not a guess
- [ ] Findings are prioritized; the report leads with what matters most
- [ ] Read-only: nothing is edited — recommendations only
- [ ] The report is dated and self-contained (a reader needs no extra context)
