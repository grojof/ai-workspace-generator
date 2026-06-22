---
name: aiws-secure-commit
description: >
  Create commits per policy (no co-author, with approval, conventional). Trigger: when committing changes.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.46.0
  version: "1.0"
---
## aiws-secure-commit

Create commits following the project policy. Prepare and **ask for approval** before committing.

### Rules
- Conventional Commits, imperative (`feat:`, `fix:`, …). One logical change per commit.
- Authored by the **user's git identity**. Do **not** add `Co-Authored-By:` or AI attribution.
- Never use `--no-verify` or bypass hooks.

### Flow
1. Stage only this task's changes (selective `git add`).
2. Write the message (subject ≤ 72, body with the why).
3. Show the diff and message, ask for confirmation, commit on approval.
