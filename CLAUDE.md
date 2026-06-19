<!-- ai-workspace:begin:claude -->
# ai-workspace-generator — Claude Code

The canonical guidance for this repo lives in **AGENTS.md**. It is imported below; do not duplicate
rules here — edit `AGENTS.md` and run `ai-workspace sync`.

@AGENTS.md

## Claude-specific notes

- Skills live in `.claude/skills/`; load them by trigger, not preemptively.
- Slash commands live in `.claude/commands/` (incl. `/doc-sync` and `/sdd-*`).
- MCP servers are configured in `.mcp.json` (includes **context7** for up-to-date library docs).
- Local-only overrides go in `.claude/settings.local.json` (git-ignored).
<!-- ai-workspace:end:claude -->
