---
description: Generate or sync the AI workspace in the current repo using the ai-workspace CLI.
---

# /aiws

Drive the **ai-workspace** generator from inside Claude Code. Use it to set up or refresh the AI
workspace (AGENTS.md, CLAUDE.md, Copilot files, SDD, living docs, MCPs) for the current project.

Decide the right subcommand from the user's intent, then run it via Bash (the installed command is
`ai-workspace`):

- First-time setup (interactive): `ai-workspace init`
- Re-render after editing `workspace.config.yaml` or `AGENTS.md`: `ai-workspace sync`
- Add a module: `ai-workspace add <language|framework|environment|mcp> <id>`
- Ingest existing company assets: `ai-workspace import <path...>`
- Preview template changes: `ai-workspace upgrade --check`
- Lint the workspace: `ai-workspace doctor`

After running, summarize what changed and point the user to `AI-WORKSPACE.md`. If the user asked to
reconcile imported standards, read `docs/ai/INGEST-RECONCILE.md` and use **context7** to verify each
item against the pinned versions, annotating outdated practices (company/business rules win on conflict).
