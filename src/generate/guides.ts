import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";

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

const GUIDE_ES = `## Guía: trabajar con este workspace de IA

Esta guía es para personas que programan pero están empezando con la IA (agentes, skills, MCP, SDD).
Explica **qué es** este workspace, **cómo empezar** y **cómo sacarle partido**.

### ¿Qué es esto?
Tu repo trae una configuración de IA lista para **Claude Code** y **GitHub Copilot**. Todo nace de un
único fichero, \`AGENTS.md\` (la "fuente de verdad"), del que se generan los ficheros para cada herramienta.
No edites los espejos: edita \`AGENTS.md\` y vuelve a generar.

### Conceptos en 1 minuto
- **AGENTS.md**: las reglas del proyecto que la IA debe seguir (estilo, convenciones, negocio).
- **Skill**: una mini-guía que la IA carga *cuando hace falta* (por su "trigger"). Vive en \`.claude/skills/\`.
- **Slash command** (\`/algo\`): una acción que tú lanzas en Claude Code. Vive en \`.claude/commands/\`.
- **MCP**: un conector que da a la IA capacidades extra. Aquí se usa **context7** para documentación al día.
- **SDD**: una forma de planificar cambios con specs antes de programar (ver abajo).

### Empezar en un proyecto NUEVO
1. Abre el repo en VS Code (Copilot) o en Claude Code.
2. Lee \`AI-WORKSPACE.md\`: es el índice de todo lo generado.
3. Rellena las capas propias en \`AGENTS.md\`: convenciones de empresa y lógica de negocio.
4. Empieza a programar. Si el cambio es grande, usa SDD (abajo). Al terminar, ejecuta \`/doc-sync\`.

### Empezar en un proyecto EXISTENTE
1. Lo mismo, pero revisa que las reglas de \`AGENTS.md\` encajan con el código actual.
2. Si tenéis estándares de empresa en otra carpeta, se pueden ingerir con \`ai-workspace import <ruta>\`.
3. Ejecuta \`/doc-sync\` para que la IA tenga un mapa del estado actual del proyecto.

### SDD paso a paso (planificar antes de programar)
Úsalo para cambios no triviales. Cada paso deja un fichero en \`openspec/changes/<cambio>/\`:
1. \`/sdd-explore\` — investiga el problema y las opciones.
2. \`/sdd-propose\` — escribe la intención, alcance y enfoque.
3. \`/sdd-spec\` — define QUÉ debe cumplirse (requisitos + escenarios).
4. \`/sdd-design\` — define CÓMO (diseño técnico, diagramas).
5. \`/sdd-tasks\` — desglosa en una checklist.
6. \`/sdd-apply\` — implementa marcando tareas.
7. \`/sdd-verify\` — comprueba que cumple la spec.
8. \`/sdd-archive\` — integra y archiva el cambio.
Empieza siempre por el paso 1 y avanza en orden. Para cambios pequeños, puedes programar sin SDD,
pero ejecuta \`/doc-sync\` al acabar para no perder el contexto.

### Cómo te ayudo (yo, la IA)
- Pídeme: "guíame para configurar este workspace", "explícame SDD con un ejemplo",
  "ayúdame a empezar este cambio con specs", o "qué reglas aplican a este fichero".
- Si no sabes por dónde empezar, dime el objetivo y te propongo el flujo (SDD o directo).

### Comandos útiles del generador (terminal)
- \`ai-workspace sync\` — regenera tras editar \`AGENTS.md\` o la config.
- \`ai-workspace add <language|framework|environment|mcp> <id>\` — añade tecnología o entorno.
- \`ai-workspace doctor\` — revisa que todo está sano.
`;

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

const GUIDE_CMD_ES = `---
description: Guía para usar este workspace de IA (SDD, skills, MCP) — ideal si estás empezando.
---

# /aiws-guide

Explica al usuario cómo trabajar con este workspace según su nivel y su objetivo. Si es principiante,
empieza por los conceptos y un ejemplo concreto de SDD. Si pregunta por un cambio, propón el flujo
adecuado (SDD o directo) y guíale paso a paso. Apóyate en la skill \`ai-workspace-guide\` y en \`AI-WORKSPACE.md\`.
`;

const GUIDE_CMD_EN = `---
description: Guide to using this AI workspace (SDD, skills, MCP) — great for beginners.
---

# /aiws-guide

Explain how to work with this workspace based on the user's level and goal. For beginners, start with
concepts and a concrete SDD example. For a change request, propose the right flow (SDD or direct) and
walk them through it. Lean on the \`ai-workspace-guide\` skill and \`AI-WORKSPACE.md\`.
`;

const GUIDE_PROMPT_ES = `---
mode: agent
description: Guía para usar este workspace de IA (SDD, skills, MCP).
---

Ayuda al usuario a trabajar con este workspace. Explica conceptos si es principiante, y propón el flujo
SDD o directo según su objetivo. Usa \`AGENTS.md\` y \`AI-WORKSPACE.md\` como referencia.
`;

const GUIDE_PROMPT_EN = `---
mode: agent
description: Guide to using this AI workspace (SDD, skills, MCP).
---

Help the user work with this workspace. Explain concepts for beginners and propose the SDD or direct
flow based on their goal. Use \`AGENTS.md\` and \`AI-WORKSPACE.md\` as reference.
`;

export function generateGuides(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const es = config.language === "es";
  const desc = es
    ? "Enseña a usar este workspace de IA (SDD, skills, MCP), para perfiles que empiezan con IA. Trigger: cuando el usuario pregunta cómo usar el workspace, cómo empezar, o qué es SDD."
    : "Teaches how to use this AI workspace (SDD, skills, MCP), for people new to AI. Trigger: when the user asks how to use the workspace, how to start, or what SDD is.";

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/skills/ai-workspace-guide/SKILL.md"), frontmatter("ai-workspace-guide", desc) + (es ? GUIDE_ES : GUIDE_EN)));
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-guide.md"), es ? GUIDE_CMD_ES : GUIDE_CMD_EN));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/aiws-guide.prompt.md"), es ? GUIDE_PROMPT_ES : GUIDE_PROMPT_EN));
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

const VSCODE_SKILL_ES = `## Configurar VS Code para este workspace

### Extensiones
Abre la pestaña Extensiones: VS Code te ofrecerá instalar las **recomendadas** del repo
(\`.vscode/extensions.json\`): Copilot, Copilot Chat, EditorConfig, ESLint/Prettier (si aplica),
y el visor de Mermaid. Acepta para tener el mismo entorno que el resto del equipo.

### Perfiles (recomendado)
Un **perfil** agrupa extensiones y ajustes para un tipo de trabajo. Crea uno para este proyecto:
1. Menú: *Code → Settings → Profiles → Create Profile…* (o el icono de engranaje → Perfiles).
2. Nómbralo, p. ej. \`IA-Trabajo\`. Marca incluir las extensiones recomendadas.
3. Cambia de perfil cuando entres/salgas del proyecto para no mezclar extensiones.
Ventaja: aíslas lo que necesitas para IA aquí sin saturar tu VS Code global.

### Copilot
- Copilot lee \`.github/copilot-instructions.md\` y \`.github/instructions/*.instructions.md\` automáticamente.
- Los prompts de \`.github/prompts/*.prompt.md\` (incl. \`/sdd-*\` y \`doc-sync\`) están disponibles en el chat.
- Configura el MCP de \`.vscode/mcp.json\` si tu versión de VS Code lo soporta.

### Claude Code
- Abre el repo; lee \`CLAUDE.md\` (que importa \`AGENTS.md\`). Las skills y \`/comandos\` ya están listos.
`;

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
  const es = config.language === "es";

  // extensions.json and settings.json are user-owned: create if missing so we don't clobber team edits.
  results.push(writeIfMissing(resolve(cwd, ".vscode/extensions.json"), extensionsJson(config)));
  results.push(writeIfMissing(resolve(cwd, ".vscode/settings.json"), settingsJson(config)));

  if (config.targets.includes("claude")) {
    const desc = es
      ? "Configura VS Code (extensiones recomendadas y perfiles) para trabajar bien con este workspace. Trigger: cuando el usuario pregunta por extensiones, perfiles de VS Code o cómo preparar el editor."
      : "Set up VS Code (recommended extensions and profiles) to work well with this workspace. Trigger: when the user asks about extensions, VS Code profiles, or preparing the editor.";
    results.push(writeFile(resolve(cwd, ".claude/skills/vscode-setup/SKILL.md"), frontmatter("vscode-setup", desc) + (es ? VSCODE_SKILL_ES : VSCODE_SKILL_EN)));
  }
  return results;
}
