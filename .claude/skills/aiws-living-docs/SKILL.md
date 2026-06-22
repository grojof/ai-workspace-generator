---
name: aiws-living-docs
description: >
  Keep the living docs (project status) current so the AI always has fresh project context. Trigger: after finishing a task or when project state changed.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.50.0
  version: "1.0"
---
## aiws-living-docs

Maintain an always-current, token-cheap snapshot of the project so agents get context without
re-scanning the repo.

## What to keep current
- `docs/development/status/PROJECT-STATE.md` — overview, module map, decisions log, current status.
- `docs/development/status/ARCHITECTURE.md` — architecture with Mermaid diagrams.

## How to update
1. Scan recent changes (git status/log, modified modules).
2. If SDD is active, summarize each folder under `docs/development/changes/*`.
3. Rewrite only content inside `ai-workspace:begin/end` markers; preserve manual notes outside.
4. Keep it concise and scannable — this is read often.

Invoke via the `/aiws-doc-sync` command (Claude) or the `aiws-doc-sync` prompt (Copilot).
