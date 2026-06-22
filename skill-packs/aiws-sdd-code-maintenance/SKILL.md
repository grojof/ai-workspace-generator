---
name: aiws-sdd-code-maintenance
description: >
  Propagate a REASONS spec change into existing code — diff old vs active spec, classify each change, apply with per-change confirmation. Trigger: code must follow an edited spec.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-code-maintenance — propagate spec changes into code

When a spec changes, bring the code back in sync. Diff the previous spec revision (Git history) against the
active spec in `{{paths.specs}}/`, classify each entity/operation/dependency/flag delta as **add / modify /
remove**, and apply it with **per-change confirmation**.

### Rules
- Removals are **archived** (Git history + change-folder), never silently deleted.
- Hand-edited files are detected via SHA-256 vs the recorded hash; never overwrite without confirmation.
- Reuse `aiws-sdd-code-generation`'s patterns for the add/modify cases; keep the layer ordering.
- When an operation **signature** changes, hand off to `aiws-sdd-test-generation` to re-derive its tests.

### Record
Append the change set (per-change verdict, files + SHA-256) to `{{paths.changes}}/<change>/`. The spec stays the
source of truth — if the code and spec disagree, fix the spec first.
