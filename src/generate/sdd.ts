import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { strings, type Phase } from "../i18n/strings.js";

export type { Phase } from "../i18n/strings.js";

/** SDD phases for the active language. */
export function phasesFor(config: Config): Phase[] {
  return strings(config.language).phases;
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
    ? `# Estado del proyecto OpenSpec

> Registro canónico, en el repo, de convenciones y specs actuales para SDD.
> Creado por ai-workspace. Edítalo libremente.

## Convenciones
Ver \`AGENTS.md\` (fuente única de verdad).

## Specs
Las especificaciones estables viven en \`openspec/specs/\`. Los cambios activos en \`openspec/changes/\`.
`
    : `# OpenSpec project state

> Canonical, in-repo record of project conventions and current specs for SDD.
> Created by ai-workspace. Edit freely.

## Conventions
See \`AGENTS.md\` (single source of truth).

## Specs
Stable specifications live in \`openspec/specs/\`. Active changes live in \`openspec/changes/\`.
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
  }

  return results;
}
