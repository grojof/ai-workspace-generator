---
name: sdd-spec-sync
description: >
  SPDD code→prompt sync — fold non-behavioural code changes back into the REASONS Canvas and report spec↔code drift. Propose-and-review, never auto-apply. Trigger: code was refactored/fixed and the spec must catch up, or to check drift.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-spec-sync — keep the REASONS Canvas in sync with the code (SPDD)

In SPDD the REASONS spec in `{{paths.specs}}/` is the **source of truth**. This skill handles the
**code → prompt** direction of the closed loop — folding **non-behavioural** code changes (refactors,
renames, extracted helpers, bug fixes) back into the Canvas so it never becomes an outdated historical
record. It also **reports drift**: where code and spec disagree.

> Direction matters. **Behaviour/logic changes go the other way** — *fix the prompt first*: edit the
> Canvas, then propagate with `sdd-code-maintenance`. Use this skill only for code-side changes that do
> **not** change intent.

### How to work (propose-and-review — never auto-apply)
1. **Compare** the current code against the active Canvas (`{{paths.specs}}/`): map files/components to the
   Canvas's Structure (§S) and Operations (§O).
2. **Classify** each diff: *non-behavioural* (refactor/rename/extract → sync into the Canvas) vs
   *behavioural* (**STOP** — that is a logic change; route to `sdd-code-maintenance`, prompt-first).
3. **Report drift** — list where code and Canvas disagree, and whether each side looks intentional.
4. **Propose** the Canvas edits as a diff on the **affected sections only** (preserve everything else).
5. **Wait for approval.** Do **not** edit the Canvas or code without explicit human sign-off — human review
   is load-bearing (only a person can confirm the Canvas still matches the real business intent). Suggest
   running the API/unit tests before any code is touched.

### Rules
- **No auto-apply.** This skill *proposes*; the human *approves*. Honour the Safety gate.
- Touch only the Canvas sections affected; never rewrite the whole spec.
- A behavioural change is **out of scope** here — it must update the prompt first (`sdd-code-maintenance`).
- Record the sync (what folded back, drift resolved) in `{{paths.changes}}/<change>/`.

Invoke via `/sdd-sync`.
