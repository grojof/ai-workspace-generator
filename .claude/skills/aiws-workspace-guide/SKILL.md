---
name: aiws-workspace-guide
description: >
  Teaches how to use this AI workspace (SDD, skills, MCP), for people new to AI. Trigger: when the user asks how to use the workspace, how to start, or what SDD is.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.51.0
  version: "1.0"
---
## Guide: working with this AI workspace

For developers who code but are new to AI (agents, skills, MCP, SDD). Explains **what** this is,
**how to start**, and **how to get value** from it.

### What is this?
Your repo ships an AI setup for **Claude Code** and **GitHub Copilot**, all generated from one file,
`AGENTS.md` (the source of truth). Don't edit the mirrors — edit `AGENTS.md` and regenerate.

### Concepts in 1 minute
- **AGENTS.md**: the project rules the AI must follow.
- **Skill**: a mini-guide the AI loads on demand (by its trigger). In `.claude/skills/`.
- **Slash command** (`/something`): an action you launch in Claude Code. In `.claude/commands/`.
- **MCP**: a connector giving the AI extra powers. Here **context7** provides up-to-date docs.
- **SDD**: planning changes with specs before coding (below).

### Start on a NEW project
1. Open the repo in VS Code (Copilot) or Claude Code.
2. Read `AI-WORKSPACE.md` — the index of everything generated.
3. Fill your own layers in `AGENTS.md`: company conventions and business logic.
4. Start coding. For big changes use SDD. When done, run `/aiws-doc-sync`.

### Start on an EXISTING project
1. Same, but check the `AGENTS.md` rules fit the current code.
2. Ingest existing company standards with `ai-workspace import <path>`.
3. Run `/aiws-doc-sync` so the AI has a map of the current state.

### SDD step by step
For non-trivial changes; each step writes a file in `docs/development/changes/<change>/`:
`/aiws-sdd-explore` → `/aiws-sdd-propose` → `/aiws-sdd-spec` → `/aiws-sdd-design` → `/aiws-sdd-tasks` → `/aiws-sdd-apply` →
`/aiws-sdd-verify` → `/aiws-sdd-archive`. Go in order. Small changes can skip SDD, but run `/aiws-doc-sync` after.

### Useful generator commands
- `ai-workspace sync` — regenerate after editing `AGENTS.md`/config.
- `ai-workspace add <language|framework|environment|mcp> <id>` — add tech or environment.
- `ai-workspace doctor` — health check.
