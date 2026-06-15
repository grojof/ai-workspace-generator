import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { strings, type Phase } from "../i18n/strings.js";

export type { Phase } from "../i18n/strings.js";

/**
 * Whether this workspace seeds a project `constitution.md`. The constitution is a *greenfield
 * bootstrap* idea borrowed from Spec-Kit, so it only applies to brand-new repos; existing projects
 * derive their principles from the code and from Layers 3/4 instead.
 */
export function usesConstitution(config: Config): boolean {
  return config.sdd.enabled && config.sdd.constitution && config.project.mode === "new";
}

/** SDD phases for the active language, filtered to the ones this config actually uses. */
export function phasesFor(config: Config): Phase[] {
  const all = strings(config.language).phases;
  if (usesConstitution(config)) return all;
  return all.filter((p) => p.name !== "sdd-constitution");
}

function commandFile(p: Phase, config: Config): string {
  const es = config.language === "es";
  const backend = config.sdd.backend;
  return [
    "---",
    `description: ${p.summary}`,
    "---",
    "",
    `# /${p.name}`,
    "",
    p.does,
    "",
    backend === "none"
      ? es
        ? "> Backend `none`: los artefactos no se persisten en disco."
        : "> Backend `none`: artifacts are not persisted to disk."
      : es
        ? "> Los artefactos se versionan en `openspec/` y se revisan en PRs."
        : "> Artifacts are versioned in `openspec/` and reviewed in PRs.",
    backend === "hybrid"
      ? es
        ? "> Si engram está disponible, persiste también un resumen en memoria entre sesiones; los ficheros del repo siguen siendo canónicos."
        : "> If engram is available, also persist a summary to cross-session memory; the in-repo files remain canonical."
      : "",
    "",
    es
      ? "Sigue el ciclo SDD de AGENTS.md. Lee los artefactos previos de la carpeta del cambio antes de escribir el siguiente."
      : "Follow the SDD lifecycle in AGENTS.md. Read prior artifacts in the change folder before writing the next one.",
  ].filter((l) => l !== "").join("\n");
}

function copilotPrompt(p: Phase, config: Config): string {
  const es = config.language === "es";
  return [
    "---",
    "mode: agent",
    `description: ${p.summary}`,
    "---",
    "",
    p.does,
    "",
    es
      ? "Sigue el ciclo SDD documentado en `.github/copilot-instructions.md` / `AGENTS.md`."
      : "Follow the SDD lifecycle documented in `.github/copilot-instructions.md` / `AGENTS.md`.",
  ].join("\n");
}

function projectSeed(config: Config): string {
  return config.language === "es"
    ? `# Estado del proyecto (SDD)

> Registro canónico, en el repo, de convenciones y specs actuales para el flujo SDD.
> Creado por ai-workspace. Edítalo libremente.
>
> La carpeta \`openspec/\` usa la *disposición* de OpenSpec (specs/ + changes/ + archive/) como
> **convención** — no es una dependencia del CLI de OpenSpec. Los artefactos son Markdown plano y
> legibles por cualquier IA. Ver \`AGENTS.md\` → sección SDD.

## Convenciones
Ver \`AGENTS.md\` (fuente única de verdad).

## Specs
Las especificaciones estables viven en \`openspec/specs/\`. Los cambios activos en \`openspec/changes/\`.
`
    : `# Project state (SDD)

> Canonical, in-repo record of project conventions and current specs for the SDD flow.
> Created by ai-workspace. Edit freely.
>
> The \`openspec/\` folder uses OpenSpec's *layout* (specs/ + changes/ + archive/) as a **convention** —
> it is not a dependency on the OpenSpec CLI. Artifacts are plain Markdown, readable by any AI tool.
> See \`AGENTS.md\` → SDD section.

## Conventions
See \`AGENTS.md\` (single source of truth).

## Specs
Stable specifications live in \`openspec/specs/\`. Active changes live in \`openspec/changes/\`.
`;
}

/** Greenfield bootstrap seed (Spec-Kit idea, OpenSpec layout). Written only for new projects. */
function constitutionSeed(config: Config): string {
  return config.language === "es"
    ? `# Constitución del proyecto

> Principios no-negociables que guían cada spec, diseño y decisión técnica. Idea tomada de Spec-Kit
> (su \`constitution\`), mantenida aquí como Markdown plano — sin dependencia de su CLI.
> Creado por ai-workspace para proyectos nuevos. Edítalo: esto es tuyo.

## Principios
1. _(ej.)_ La simplicidad gana: la solución más simple que cumpla la spec.
2. _(ej.)_ Tests antes de dar por hecho un comportamiento.
3. _(añade los vuestros)_

## Límites (lo que no haremos)
- _(ej.)_ Sin dependencias nuevas sin justificación en la propuesta.

> Las specs (\`openspec/specs/\`) y los cambios (\`openspec/changes/\`) deben respetar esta constitución.
`
    : `# Project constitution

> Non-negotiable principles that guide every spec, design and technical decision. Idea borrowed from
> Spec-Kit (its \`constitution\`), kept here as plain Markdown — no dependency on its CLI.
> Created by ai-workspace for new projects. Edit freely: this is yours.

## Principles
1. _(e.g.)_ Simplicity wins: the simplest solution that satisfies the spec.
2. _(e.g.)_ No behavior is "done" until it has a test.
3. _(add your own)_

## Boundaries (what we won't do)
- _(e.g.)_ No new dependencies without a justification in the proposal.

> Specs (\`openspec/specs/\`) and changes (\`openspec/changes/\`) must honor this constitution.
`;
}

/** Scaffold the SDD module: slash commands, optional Copilot prompts, and the openspec store. */
export function generateSdd(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.sdd.enabled) return results;
  const phases = phasesFor(config);

  if (config.targets.includes("claude")) {
    for (const p of phases) {
      results.push(writeFile(resolve(cwd, `.claude/commands/${p.name}.md`), commandFile(p, config)));
    }
  }
  if (config.targets.includes("copilot")) {
    for (const p of phases) {
      results.push(writeFile(resolve(cwd, `.github/prompts/${p.name}.prompt.md`), copilotPrompt(p, config)));
    }
  }

  if (config.sdd.backend !== "none") {
    results.push(writeIfMissing(resolve(cwd, "openspec/project.md"), projectSeed(config)));
    results.push(writeIfMissing(resolve(cwd, "openspec/specs/.gitkeep"), ""));
    results.push(writeIfMissing(resolve(cwd, "openspec/changes/.gitkeep"), ""));
    if (usesConstitution(config)) {
      results.push(writeIfMissing(resolve(cwd, "openspec/constitution.md"), constitutionSeed(config)));
    }
  }

  return results;
}
