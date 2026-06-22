---
description: Refresh the living docs (project state + architecture) so the AI has fresh context.
---

# /aiws-doc-sync

Update the project's living documentation so any agent gets accurate context cheaply.

1. Scan recent changes (git status/log, modified modules).
2. Update `docs/development/status/PROJECT-STATE.md`: overview, module map, decisions log, current status.
   - If SDD is active, summarize the state of each folder under `docs/development/changes/*`.
3. Update `docs/development/status/ARCHITECTURE.md`: keep Mermaid diagrams current (architecture, data flow, module deps).
4. Only rewrite content inside `ai-workspace:begin/end` markers; preserve manual notes outside them.

Keep it concise — this file is read often; favor a compact, scannable snapshot over prose.
