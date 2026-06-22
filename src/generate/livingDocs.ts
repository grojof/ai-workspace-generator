import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";

// AI-facing command/prompt → English only (token efficiency), regardless of config.language.
function docSyncCommand(config: Config): string {
  const p = docsPaths(config);
  return `---
description: Refresh the living docs (project state + architecture) so the AI has fresh context.
---

# /aiws-doc-sync

Update the project's living documentation so any agent gets accurate context cheaply.

1. Scan recent changes (git status/log, modified modules).
2. Update \`${p.status}/PROJECT-STATE.md\`: overview, module map, decisions log, current status.
   - If SDD is active, summarize the state of each folder under \`${p.changes}/*\`.
3. Update \`${p.status}/ARCHITECTURE.md\`: keep Mermaid diagrams current (architecture, data flow, module deps).
4. Only rewrite content inside \`ai-workspace:begin/end\` markers; preserve manual notes outside them.

Keep it concise — this file is read often; favor a compact, scannable snapshot over prose.
`;
}

function docSyncPrompt(config: Config): string {
  const p = docsPaths(config);
  return `---
mode: agent
description: Refresh the living docs (project state + architecture).
---

Update \`${p.status}/PROJECT-STATE.md\` and \`${p.status}/ARCHITECTURE.md\` to reflect the current state of the
repo. Keep Mermaid diagrams current. Preserve content outside ai-workspace markers. Keep it concise.
`;
}

function projectStateSeed(config: Config): string {
  const name = config.project.name;
  if (config.language === "es") {
    return `# Estado del proyecto — ${name}

> Foto viva mantenida con \`/aiws-doc-sync\`. Léela antes de escanear el repo.

<!-- ai-workspace:begin:overview -->
## Visión general
${config.project.description || "_Describe el proyecto aquí, o ejecuta /aiws-doc-sync para generarlo._"}

## Mapa de módulos
_Ejecuta \`/aiws-doc-sync\` para rellenarlo._

## Registro de decisiones
_ADRs ligeros aquí (fecha · decisión · porqué)._

## Estado actual
_Ejecuta \`/aiws-doc-sync\` para rellenarlo._
<!-- ai-workspace:end:overview -->
`;
  }
  return `# Project State — ${name}

> Living snapshot maintained via \`/aiws-doc-sync\`. Read this before scanning the repo.

<!-- ai-workspace:begin:overview -->
## Overview
${config.project.description || "_Describe the project here, or run /aiws-doc-sync to generate._"}

## Module map
_Run \`/aiws-doc-sync\` to populate._

## Decisions log
_Lightweight ADRs go here (date · decision · why)._

## Current status
_Run \`/aiws-doc-sync\` to populate._
<!-- ai-workspace:end:overview -->
`;
}

function architectureSeed(config: Config): string {
  const name = config.project.name;
  const es = config.language === "es";
  const placeholder = es
    ? "_Reemplázalo con la arquitectura real vía `/aiws-doc-sync`._"
    : "_Replace with the real architecture via `/aiws-doc-sync`._";
  const heading = es
    ? "Maintenido con `/aiws-doc-sync`. Usa Mermaid para los diagramas."
    : "Maintained via `/aiws-doc-sync`. Use Mermaid for diagrams.";
  return `# ${es ? "Arquitectura" : "Architecture"} — ${name}

> ${heading}

<!-- ai-workspace:begin:diagram -->
\`\`\`mermaid
flowchart TD
  A[${es ? "Punto de entrada" : "Entry point"}] --> B[${es ? "Módulos" : "Modules"}]
  B --> C[("${es ? "Datos / servicios externos" : "Data / external services"}")]
\`\`\`

${placeholder}
<!-- ai-workspace:end:diagram -->
`;
}

/** Scaffold the living-docs system: /aiws-doc-sync command/prompt + seed docs (user-owned). */
export function generateLivingDocs(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.livingDocs) return results;
  const status = docsPaths(config).status;

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-doc-sync.md"), docSyncCommand(config)));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/aiws-doc-sync.prompt.md"), docSyncPrompt(config)));
  }

  results.push(writeIfMissing(resolve(cwd, `${status}/PROJECT-STATE.md`), projectStateSeed(config)));
  results.push(writeIfMissing(resolve(cwd, `${status}/ARCHITECTURE.md`), architectureSeed(config)));

  return results;
}
