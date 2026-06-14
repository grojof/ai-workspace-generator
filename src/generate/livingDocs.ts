import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";

const DOC_SYNC_COMMAND_EN = `---
description: Refresh the living docs (project state + architecture) so the AI has fresh context.
---

# /doc-sync

Update the project's living documentation so any agent gets accurate context cheaply.

1. Scan recent changes (git status/log, modified modules).
2. Update \`docs/ai/PROJECT-STATE.md\`: overview, module map, decisions log, current status.
   - If SDD is active, summarize the state of each folder under \`openspec/changes/*\`.
3. Update \`docs/ai/ARCHITECTURE.md\`: keep Mermaid diagrams current (architecture, data flow, module deps).
4. Only rewrite content inside \`ai-workspace:begin/end\` markers; preserve manual notes outside them.

Keep it concise — this file is read often; favor a compact, scannable snapshot over prose.
`;

const DOC_SYNC_COMMAND_ES = `---
description: Refresca las docs vivas (estado del proyecto + arquitectura) para que la IA tenga contexto fresco.
---

# /doc-sync

Actualiza la documentación viva del proyecto para que cualquier agente obtenga contexto preciso y barato.

1. Revisa los cambios recientes (git status/log, módulos modificados).
2. Actualiza \`docs/ai/PROJECT-STATE.md\`: visión general, mapa de módulos, registro de decisiones, estado actual.
   - Si SDD está activo, resume el estado de cada carpeta de \`openspec/changes/*\`.
3. Actualiza \`docs/ai/ARCHITECTURE.md\`: mantén los diagramas Mermaid al día (arquitectura, flujo de datos, dependencias).
4. Reescribe solo el contenido entre los marcadores \`ai-workspace:begin/end\`; preserva las notas manuales fuera.

Mantenlo conciso — este fichero se lee a menudo; prioriza una foto compacta y escaneable sobre la prosa.
`;

const DOC_SYNC_PROMPT_EN = `---
mode: agent
description: Refresh the living docs (project state + architecture).
---

Update \`docs/ai/PROJECT-STATE.md\` and \`docs/ai/ARCHITECTURE.md\` to reflect the current state of the
repo. Keep Mermaid diagrams current. Preserve content outside ai-workspace markers. Keep it concise.
`;

const DOC_SYNC_PROMPT_ES = `---
mode: agent
description: Refresca las docs vivas (estado del proyecto + arquitectura).
---

Actualiza \`docs/ai/PROJECT-STATE.md\` y \`docs/ai/ARCHITECTURE.md\` para reflejar el estado actual del
repo. Mantén los diagramas Mermaid al día. Preserva el contenido fuera de los marcadores ai-workspace. Sé conciso.
`;

function projectStateSeed(config: Config): string {
  const name = config.project.name;
  if (config.language === "es") {
    return `# Estado del proyecto — ${name}

> Foto viva mantenida con \`/doc-sync\`. Léela antes de escanear el repo.

<!-- ai-workspace:begin:overview -->
## Visión general
${config.project.description || "_Describe el proyecto aquí, o ejecuta /doc-sync para generarlo._"}

## Mapa de módulos
_Ejecuta \`/doc-sync\` para rellenarlo._

## Registro de decisiones
_ADRs ligeros aquí (fecha · decisión · porqué)._

## Estado actual
_Ejecuta \`/doc-sync\` para rellenarlo._
<!-- ai-workspace:end:overview -->
`;
  }
  return `# Project State — ${name}

> Living snapshot maintained via \`/doc-sync\`. Read this before scanning the repo.

<!-- ai-workspace:begin:overview -->
## Overview
${config.project.description || "_Describe the project here, or run /doc-sync to generate._"}

## Module map
_Run \`/doc-sync\` to populate._

## Decisions log
_Lightweight ADRs go here (date · decision · why)._

## Current status
_Run \`/doc-sync\` to populate._
<!-- ai-workspace:end:overview -->
`;
}

function architectureSeed(config: Config): string {
  const name = config.project.name;
  const es = config.language === "es";
  const placeholder = es ? "_Reemplázalo con la arquitectura real vía `/doc-sync`._" : "_Replace with the real architecture via `/doc-sync`._";
  const heading = es ? "Maintenido con `/doc-sync`. Usa Mermaid para los diagramas." : "Maintained via `/doc-sync`. Use Mermaid for diagrams.";
  return `# ${es ? "Arquitectura" : "Architecture"} — ${name}

> ${heading}

<!-- ai-workspace:begin:diagram -->
\`\`\`mermaid
flowchart TD
  A[${es ? "Punto de entrada" : "Entry point"}] --> B[${es ? "Módulos" : "Modules"}]
  B --> C[(${es ? "Datos / servicios externos" : "Data / external services"})]
\`\`\`

${placeholder}
<!-- ai-workspace:end:diagram -->
`;
}

/** Scaffold the living-docs system: /doc-sync command/prompt + seed docs (user-owned). */
export function generateLivingDocs(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.livingDocs) return results;
  const es = config.language === "es";

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/commands/doc-sync.md"), es ? DOC_SYNC_COMMAND_ES : DOC_SYNC_COMMAND_EN));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/doc-sync.prompt.md"), es ? DOC_SYNC_PROMPT_ES : DOC_SYNC_PROMPT_EN));
  }

  results.push(writeIfMissing(resolve(cwd, "docs/ai/PROJECT-STATE.md"), projectStateSeed(config)));
  results.push(writeIfMissing(resolve(cwd, "docs/ai/ARCHITECTURE.md"), architectureSeed(config)));

  return results;
}
