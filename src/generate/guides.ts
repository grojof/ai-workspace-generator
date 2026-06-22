import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";
import { LANGUAGES, FRAMEWORKS, ENVIRONMENTS, type ModuleEntry } from "../modules/registry.js";
import { skillFrontmatter as frontmatter } from "./naming.js";

/** Registry entries present in the config's stack, in catalog order (languages → frameworks → environments). */
function stackModules(config: Config): ModuleEntry[] {
  const ids = new Set([
    ...config.stack.languages.map((l) => l.id),
    ...config.stack.frameworks.map((f) => f.id),
    ...config.stack.environments.map((e) => e.id),
  ]);
  return [...LANGUAGES, ...FRAMEWORKS, ...ENVIRONMENTS].filter((m) => ids.has(m.id));
}

/**
 * Beginner-facing material vendored into each project: a learner skill, a slash
 * command / Copilot prompt to invoke it, recommended VS Code extensions, and a
 * VS Code setup guide. Written for developers new to AI agents/skills/MCP.
 */

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
walk them through it. Lean on the \`aiws-workspace-guide\` skill and \`AI-WORKSPACE.md\`.
`;

const GUIDE_PROMPT_EN = `---
mode: agent
description: Guide to using this AI workspace (SDD, skills, MCP).
---

Help the user work with this workspace. Explain concepts for beginners and propose the SDD or direct
flow based on their goal. Use \`AGENTS.md\` and \`AI-WORKSPACE.md\` as reference.
`;

// ---------------------------------------------------------------------------
// Guided configuration skill (analyze an existing repo, or set up a new one)
// ---------------------------------------------------------------------------

const CONFIGURE_SKILL_EN = `## Configure this AI workspace (guided)

Help the user produce a correct, explained \`workspace.config.yaml\` and skill set — for an **existing** repo
(analyze → propose) or a **new** one (describe → ask). **Propose-and-review: never write or move files
without explicit approval.**

### 1. Analyze
- Run \`ai-workspace detect --json\` for a deterministic stack seed (languages/frameworks/environments).
- Read the repo to enrich it: manifests, folder layout, existing docs/configs. Note anything the detector
  missed. If nothing is detected and it's a new project, **ask** targeted questions instead of guessing.

### 2. Propose
- Draft a candidate \`workspace.config.yaml\` (project, profile, stack, sdd, language, targets…). Validate
  every module id against the registry (\`ai-workspace list\`); for a gap, propose either adding a module or
  discovering a pack with the \`find-skills\` skill — and say why.
- **Profile is the user's choice — never infer it.** \`profile.userType\` (technical | business) and
  \`profile.experience\` (beginner | standard | advanced) set the governance posture. Detection seeds the
  **stack only**; it does NOT tell you the user type. **Ask** both explicitly; do not assume "technical"
  because code was detected.

#### Option guide (what each means, and the *why* — explain before you ask)
- **targets** — which AI tools to wire: \`claude\` (CLAUDE.md + skills + .mcp.json), \`copilot\` (.github/*, also
  Visual Studio), \`codex\` (AGENTS.md as instructions + .codex/config.toml). *Why:* only generate for tools
  the user actually uses.
- **profile.userType** — \`technical\` (code/devops/data/infra) vs \`business\` (process/docs/analysis). *Why:*
  tunes how much architecture/testing/security depth the AI applies.
- **profile.experience** — \`beginner\` (clear guidance, safe paths) · \`standard\` (balance) · \`advanced\`
  (trade-offs, more autonomy). *Why:* tunes verbosity and how many decisions are surfaced.
- **project.mode** — \`new\` (use current stable versions) vs \`existing\` (conserve versions; upgrade only on
  assessment). *Why:* governs the versioning posture and the Safety gate.
- **project.purpose** — \`build\` (normal) vs \`learn\` (tutor mode). *Why:* adds learner skills/explanations.
- **stack** — languages / frameworks / environments (+ versions). *Why:* drives per-layer rules and VS Code recs.
- **sdd.enabled / backend / methodology** — SDD on/off; artifacts in \`files\` (recommended), \`hybrid\` (+ memory),
  or \`none\`; \`sdd\` vs \`spdd\`. *Why:* where specs live and how much process for non-trivial changes.
- **workflow.hooks.safetyGuard** — \`warn\` | \`block\` | \`off\` for risky-command hook (Claude). *Why:* hardens the
  Safety gate without changing the AGENTS.md rule.
- **vscode** — generate \`.vscode/\` recs; set \`false\` for Visual Studio / non-VS-Code. **mcp (context7)** — up-to-date
  library docs. **company** — org overlay (\`none\` for personal). **language** — human-facing docs language (AI files stay English).
- Produce a **conflict report**: existing paths/docs that would collide with generated structure, plus an
  optional folder-alignment plan. Multi-repo: if the workspace spans several repos, propose a top-level
  \`repos:\` list (each with its \`path\` and optional \`stack\`); a single repo needs no \`repos\`.

### 3. Review
- Show the proposed config (as a preview/diff) with a one-line rationale per section, the skill set, and the
  conflict report. Wait for approval or edits. Change nothing yet.

### 4. Apply (only after approval)
- Write \`workspace.config.yaml\`, then run \`ai-workspace sync\` to generate artifacts (idempotent — a second
  run reports 0 changes; your text outside managed markers survives). Apply any folder moves **only** as
  approved, one reviewable step at a time (Safety gate). Finish with \`/doc-sync\` if living docs are on.
`;

const CONFIGURE_CMD_EN = `---
description: Guided workspace configuration — analyze an existing repo (or set up a new one) and propose a config.
---

# /configure

Drive the \`aiws-configure-workspace\` skill: analyze the repo (\`ai-workspace detect --json\` + read the tree),
propose a \`workspace.config.yaml\` + skill set + conflict report, and apply only after the user approves.
Never move or overwrite files without explicit approval.
`;

const CONFIGURE_PROMPT_EN = `---
mode: agent
description: Guided workspace configuration — analyze an existing repo and propose a config.
---

Analyze this repository and propose a \`workspace.config.yaml\` + skill set, then apply only after approval.
Seed detection with \`ai-workspace detect --json\`; use \`find-skills\` for gaps; never move files without
explicit approval. Follow the \`aiws-configure-workspace\` skill.
`;

// AI skill/command/prompt → English only (token efficiency).
export function generateGuides(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const desc = "Teaches how to use this AI workspace (SDD, skills, MCP), for people new to AI. Trigger: when the user asks how to use the workspace, how to start, or what SDD is.";

  // Guides reference the change folder in prose; point them at the resolved store path.
  const guideBody = GUIDE_EN.replaceAll("openspec/changes", docsPaths(config).changes);

  const configureDesc = "Configure or re-configure this AI workspace: analyze an existing repo (or set up a new one) and propose a workspace.config.yaml + skill set. Trigger: when the user wants to set up, configure, or re-detect the workspace.";

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/skills/aiws-workspace-guide/SKILL.md"), frontmatter("aiws-workspace-guide", desc) + guideBody));
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-guide.md"), GUIDE_CMD_EN));
    results.push(writeFile(resolve(cwd, ".claude/skills/aiws-configure-workspace/SKILL.md"), frontmatter("aiws-configure-workspace", configureDesc) + CONFIGURE_SKILL_EN));
    results.push(writeFile(resolve(cwd, ".claude/commands/configure.md"), CONFIGURE_CMD_EN));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/aiws-guide.prompt.md"), GUIDE_PROMPT_EN));
    results.push(writeFile(resolve(cwd, ".github/prompts/configure.prompt.md"), CONFIGURE_PROMPT_EN));
  }
  return results;
}

// ---------------------------------------------------------------------------
// VS Code setup
// ---------------------------------------------------------------------------

function extensionsJson(config: Config): string {
  // Base + per-module recommendations from the registry (single source) + Mermaid preview last.
  const recommendations = ["github.copilot", "github.copilot-chat", "editorconfig.editorconfig"];
  for (const m of stackModules(config)) {
    for (const ext of m.vscodeExtensions ?? []) if (!recommendations.includes(ext)) recommendations.push(ext);
  }
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
  // Per-language `[lang]` formatter blocks from the registry (single source).
  for (const m of stackModules(config)) {
    if (m.vscodeFormatter) settings[`[${m.id}]`] = { "editor.defaultFormatter": m.vscodeFormatter };
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
    results.push(writeFile(resolve(cwd, ".claude/skills/aiws-vscode-setup/SKILL.md"), frontmatter("aiws-vscode-setup", desc) + VSCODE_SKILL_EN));
  }
  return results;
}
