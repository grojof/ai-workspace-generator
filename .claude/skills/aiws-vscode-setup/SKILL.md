---
name: aiws-vscode-setup
description: >
  Set up VS Code (recommended extensions and profiles) to work well with this workspace. Trigger: when the user asks about extensions, VS Code profiles, or preparing the editor.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.47.0
  version: "1.0"
---
## Set up VS Code for this workspace

### Extensions
Open the Extensions tab: VS Code will offer the repo's **recommended** extensions
(`.vscode/extensions.json`): Copilot, Copilot Chat, EditorConfig, ESLint/Prettier (if applicable),
and the Mermaid preview. Accept to match the rest of the team.

### Profiles (recommended)
A **profile** bundles extensions and settings for a kind of work. Create one for this project:
1. *Code → Settings → Profiles → Create Profile…*
2. Name it, e.g. `AI-Work`. Include the recommended extensions.
3. Switch profiles when entering/leaving the project to keep extensions tidy.

### Copilot
- Copilot reads `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` automatically.
- Prompts in `.github/prompts/*.prompt.md` (incl. `/aiws-sdd-*` and `doc-sync`) are available in chat.
- Configure the MCP in `.vscode/mcp.json` if your VS Code version supports it.

### Claude Code
- Open the repo; read `CLAUDE.md` (it imports `AGENTS.md`). Skills and `/commands` are ready.
