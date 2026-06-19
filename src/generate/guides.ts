import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";

/**
 * Beginner-facing material vendored into each project: a learner skill, a slash
 * command / Copilot prompt to invoke it, recommended VS Code extensions, and a
 * VS Code setup guide. Written for developers new to AI agents/skills/MCP.
 */

function frontmatter(name: string, description: string): string {
  return ["---", `name: ${name}`, "description: >", `  ${description}`, "license: Apache-2.0", "metadata:", "  author: ai-workspace", '  version: "1.0"', "---", ""].join("\n");
}

// ---------------------------------------------------------------------------
// Learner guide skill
// ---------------------------------------------------------------------------

const GUIDE_EN = `## Guide: working with this AI workspace

For developers who code but are new to AI (agents, skills, MCP, SDD). Explains **what** this is,
**how to start**, and **how to get value** from it.

### What is this?
Your repo ships an AI setup for **Claude Code** and **GitHub Copilot**, all generated from one file,
\`AGENTS.md\` (the source of truth). Don't edit the mirrors — edit \`AGENTS.md\` and regenerate.

### Concepts in 1 minute
- **AGENTS.md**: the project rules the AI must follow.
- **Skill**: a mini-guide the AI loads on demand (by its trigger). In \`.claude/skills/\`.
- **Slash command** (\`/something\`): an action you launch in Claude Code. In \`.claude/commands/\`.
- **MCP**: a connector giving the AI extra powers. Here **context7** provides up-to-date docs.
- **SDD**: planning changes with specs before coding (below).

### Start on a NEW project
1. Open the repo in VS Code (Copilot) or Claude Code.
2. Read \`AI-WORKSPACE.md\` — the index of everything generated.
3. Fill your own layers in \`AGENTS.md\`: company conventions and business logic.
4. Start coding. For big changes use SDD. When done, run \`/doc-sync\`.

### Start on an EXISTING project
1. Same, but check the \`AGENTS.md\` rules fit the current code.
2. Ingest existing company standards with \`ai-workspace import <path>\`.
3. Run \`/doc-sync\` so the AI has a map of the current state.

### SDD step by step
For non-trivial changes; each step writes a file in \`openspec/changes/<change>/\`:
\`/sdd-explore\` → \`/sdd-propose\` → \`/sdd-spec\` → \`/sdd-design\` → \`/sdd-tasks\` → \`/sdd-apply\` →
\`/sdd-verify\` → \`/sdd-archive\`. Go in order. Small changes can skip SDD, but run \`/doc-sync\` after.

### Useful generator commands
- \`ai-workspace sync\` — regenerate after editing \`AGENTS.md\`/config.
- \`ai-workspace add <language|framework|environment|mcp> <id>\` — add tech or environment.
- \`ai-workspace doctor\` — health check.
`;

const GUIDE_CMD_EN = `---
description: Guide to using this AI workspace (SDD, skills, MCP) — great for beginners.
---

# /aiws-guide

Explain how to work with this workspace based on the user's level and goal. For beginners, start with
concepts and a concrete SDD example. For a change request, propose the right flow (SDD or direct) and
walk them through it. Lean on the \`ai-workspace-guide\` skill and \`AI-WORKSPACE.md\`.
`;

const GUIDE_PROMPT_EN = `---
mode: agent
description: Guide to using this AI workspace (SDD, skills, MCP).
---

Help the user work with this workspace. Explain concepts for beginners and propose the SDD or direct
flow based on their goal. Use \`AGENTS.md\` and \`AI-WORKSPACE.md\` as reference.
`;

// AI skill/command/prompt → English only (token efficiency).
export function generateGuides(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const desc = "Teaches how to use this AI workspace (SDD, skills, MCP), for people new to AI. Trigger: when the user asks how to use the workspace, how to start, or what SDD is.";

  // Guides reference the change folder in prose; point them at the resolved store path.
  const guideBody = GUIDE_EN.replaceAll("openspec/changes", docsPaths(config).changes);

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/skills/ai-workspace-guide/SKILL.md"), frontmatter("ai-workspace-guide", desc) + guideBody));
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-guide.md"), GUIDE_CMD_EN));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/aiws-guide.prompt.md"), GUIDE_PROMPT_EN));
  }
  return results;
}

// ---------------------------------------------------------------------------
// VS Code setup
// ---------------------------------------------------------------------------

function extensionsJson(config: Config): string {
  const recommendations = ["github.copilot", "github.copilot-chat", "editorconfig.editorconfig"];
  if (config.stack.languages.some((l) => l.id === "typescript" || l.id === "javascript")) {
    recommendations.push("dbaeumer.vscode-eslint", "esbenp.prettier-vscode");
  }
  if (config.stack.languages.some((l) => l.id === "go")) recommendations.push("golang.go");
  if (config.stack.languages.some((l) => l.id === "python")) recommendations.push("ms-python.python");
  recommendations.push("bierner.markdown-mermaid");
  return JSON.stringify({ recommendations }, null, 2);
}

const VSCODE_SKILL_EN = `## Set up VS Code for this workspace

### Extensions
Open the Extensions tab: VS Code will offer the repo's **recommended** extensions
(\`.vscode/extensions.json\`): Copilot, Copilot Chat, EditorConfig, ESLint/Prettier (if applicable),
and the Mermaid preview. Accept to match the rest of the team.

### Profiles (recommended)
A **profile** bundles extensions and settings for a kind of work. Create one for this project:
1. *Code → Settings → Profiles → Create Profile…*
2. Name it, e.g. \`AI-Work\`. Include the recommended extensions.
3. Switch profiles when entering/leaving the project to keep extensions tidy.

### Copilot
- Copilot reads \`.github/copilot-instructions.md\` and \`.github/instructions/*.instructions.md\` automatically.
- Prompts in \`.github/prompts/*.prompt.md\` (incl. \`/sdd-*\` and \`doc-sync\`) are available in chat.
- Configure the MCP in \`.vscode/mcp.json\` if your VS Code version supports it.

### Claude Code
- Open the repo; read \`CLAUDE.md\` (it imports \`AGENTS.md\`). Skills and \`/commands\` are ready.
`;

function settingsJson(config: Config): string {
  const usesNode = config.stack.languages.some((l) => l.id === "typescript" || l.id === "javascript");
  const settings: Record<string, unknown> = {
    "files.eol": "\n",
    "files.encoding": "utf8",
    "files.insertFinalNewline": true,
    "files.trimTrailingWhitespace": true,
    "editor.formatOnSave": true,
    "editor.detectIndentation": false,
    "editor.tabSize": 2,
  };
  if (usesNode) {
    settings["editor.defaultFormatter"] = "esbenp.prettier-vscode";
    settings["editor.codeActionsOnSave"] = { "source.fixAll.eslint": "explicit" };
  }
  if (config.stack.languages.some((l) => l.id === "go")) {
    settings["[go]"] = { "editor.defaultFormatter": "golang.go" };
  }
  if (config.stack.languages.some((l) => l.id === "python")) {
    settings["[python]"] = { "editor.defaultFormatter": "charliermarsh.ruff" };
  }
  return JSON.stringify(settings, null, 2);
}

export function generateVscode(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];

  // extensions.json and settings.json are user-owned: create if missing so we don't clobber team edits.
  results.push(writeIfMissing(resolve(cwd, ".vscode/extensions.json"), extensionsJson(config)));
  results.push(writeIfMissing(resolve(cwd, ".vscode/settings.json"), settingsJson(config)));

  if (config.targets.includes("claude")) {
    const desc = "Set up VS Code (recommended extensions and profiles) to work well with this workspace. Trigger: when the user asks about extensions, VS Code profiles, or preparing the editor.";
    results.push(writeFile(resolve(cwd, ".claude/skills/vscode-setup/SKILL.md"), frontmatter("vscode-setup", desc) + VSCODE_SKILL_EN));
  }
  return results;
}
