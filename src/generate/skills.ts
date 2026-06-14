import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { phasesFor } from "./sdd.js";
import type { Phase } from "../i18n/strings.js";

function frontmatter(name: string, description: string): string {
  return ["---", `name: ${name}`, "description: >", `  ${description}`, "license: Apache-2.0", "metadata:", "  author: ai-workspace", '  version: "1.0"', "---", ""].join("\n");
}

function sddSkill(p: Phase, config: Config): string {
  const es = config.language === "es";
  const trigger = es
    ? `Trigger: al planificar/ejecutar la fase ${p.name.replace("sdd-", "")} de un cambio SDD.`
    : `Trigger: when planning/executing the ${p.name.replace("sdd-", "")} phase of a Spec-Driven Development change.`;
  const lines = es
    ? [
        "## Cómo trabajar",
        "- Lee los artefactos previos de la carpeta del cambio antes de escribir el siguiente.",
        config.sdd.backend === "none"
          ? "- Backend `none`: los artefactos no se persisten en disco."
          : "- Los artefactos viven en `openspec/changes/<cambio>/` y se versionan en git.",
        "- Sigue el ciclo SDD y las convenciones de AGENTS.md y `_shared/openspec-convention.md`.",
      ]
    : [
        "## How to work",
        "- Read prior artifacts in the change folder before writing the next one.",
        config.sdd.backend === "none"
          ? "- Backend is `none`: artifacts are not persisted to disk."
          : "- Artifacts live in `openspec/changes/<change>/` and are versioned in git.",
        "- Follow the SDD lifecycle and conventions in AGENTS.md and `_shared/openspec-convention.md`.",
      ];
  return [frontmatter(p.name, `${p.summary} ${trigger}`), `## ${p.name}`, "", p.does, "", ...lines].join("\n");
}

const OPENSPEC_CONVENTION_EN = `# OpenSpec convention (shared)

SDD artifacts are plain markdown, versioned in git, readable by any AI tool.

Layout:
- \`openspec/specs/\`            — stable specifications (the current truth)
- \`openspec/changes/<name>/\`   — an in-flight change
  - \`explore.md\`  · investigation and options
  - \`proposal.md\` · intent, scope, approach, risks
  - \`spec.md\`     · requirements + acceptance scenarios (WHAT)
  - \`design.md\`   · technical design + Mermaid diagrams (HOW)
  - \`tasks.md\`    · ordered checklist (progress)
  - \`verify-report.md\` · validation against the spec
- \`openspec/changes/archive/\`  — completed changes

Rules:
- One change folder per logical change. Keep the spec as the source of truth for behavior.
- Archive a change only after verify passes; fold its delta into \`openspec/specs/\`.
`;

const OPENSPEC_CONVENTION_ES = `# Convención OpenSpec (compartida)

Los artefactos SDD son markdown plano, versionado en git, legible por cualquier herramienta de IA.

Estructura:
- \`openspec/specs/\`            — especificaciones estables (la verdad actual)
- \`openspec/changes/<nombre>/\` — un cambio en curso
  - \`explore.md\`  · investigación y opciones
  - \`proposal.md\` · intención, alcance, enfoque, riesgos
  - \`spec.md\`     · requisitos + escenarios de aceptación (QUÉ)
  - \`design.md\`   · diseño técnico + diagramas Mermaid (CÓMO)
  - \`tasks.md\`    · checklist ordenada (progreso)
  - \`verify-report.md\` · validación contra la spec
- \`openspec/changes/archive/\`  — cambios completados

Reglas:
- Una carpeta de cambio por cambio lógico. La spec es la fuente de verdad del comportamiento.
- Archiva un cambio solo cuando verify pase; funde su delta en \`openspec/specs/\`.
`;

const LIVING_DOCS_SKILL_EN = `## living-docs

Maintain an always-current, token-cheap snapshot of the project so agents get context without
re-scanning the repo.

## What to keep current
- \`docs/ai/PROJECT-STATE.md\` — overview, module map, decisions log, current status.
- \`docs/ai/ARCHITECTURE.md\` — architecture with Mermaid diagrams.

## How to update
1. Scan recent changes (git status/log, modified modules).
2. If SDD is active, summarize each folder under \`openspec/changes/*\`.
3. Rewrite only content inside \`ai-workspace:begin/end\` markers; preserve manual notes outside.
4. Keep it concise and scannable — this is read often.

Invoke via the \`/doc-sync\` command (Claude) or the \`doc-sync\` prompt (Copilot).
`;

const LIVING_DOCS_SKILL_ES = `## living-docs

Mantén una foto del proyecto siempre actualizada y barata en tokens, para que los agentes tengan
contexto sin re-escanear el repo.

## Qué mantener al día
- \`docs/ai/PROJECT-STATE.md\` — visión general, mapa de módulos, registro de decisiones, estado actual.
- \`docs/ai/ARCHITECTURE.md\` — arquitectura con diagramas Mermaid.

## Cómo actualizar
1. Revisa los cambios recientes (git status/log, módulos modificados).
2. Si SDD está activo, resume cada carpeta de \`openspec/changes/*\`.
3. Reescribe solo el contenido entre los marcadores \`ai-workspace:begin/end\`; preserva las notas manuales fuera.
4. Mantenlo conciso y escaneable — se lee a menudo.

Invócala con el comando \`/doc-sync\` (Claude) o el prompt \`doc-sync\` (Copilot).
`;

/** Generate vendored skills into the repo (`.claude/skills/`). Claude target only. */
export function generateSkills(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.targets.includes("claude")) return results;
  const es = config.language === "es";

  if (config.sdd.enabled && config.sdd.vendorSkills) {
    for (const p of phasesFor(config)) {
      results.push(writeFile(resolve(cwd, `.claude/skills/${p.name}/SKILL.md`), sddSkill(p, config)));
    }
    results.push(
      writeIfMissing(
        resolve(cwd, ".claude/skills/_shared/openspec-convention.md"),
        es ? OPENSPEC_CONVENTION_ES : OPENSPEC_CONVENTION_EN,
      ),
    );
  }

  if (config.livingDocs) {
    const desc = es
      ? "Mantén docs/ai/* al día para que la IA siempre tenga contexto fresco. Trigger: al terminar una tarea o cuando cambie el estado del proyecto."
      : "Keep docs/ai/* current so the AI always has fresh project context. Trigger: after finishing a task or when project state changed.";
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/living-docs/SKILL.md"),
        frontmatter("living-docs", desc) + (es ? LIVING_DOCS_SKILL_ES : LIVING_DOCS_SKILL_EN),
      ),
    );
  }

  return results;
}
