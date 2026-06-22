import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";
import { strings, type Phase } from "../i18n/strings.js";
import { aiwsId } from "./naming.js";

export type { Phase } from "../i18n/strings.js";

/**
 * Whether this workspace seeds a project `constitution.md`. The constitution is a *greenfield
 * bootstrap* idea borrowed from Spec-Kit, so it only applies to brand-new repos; existing projects
 * derive their principles from the code and from Layers 4/5 instead.
 */
export function usesConstitution(config: Config): boolean {
  return config.sdd.enabled && config.sdd.constitution && config.project.mode === "new";
}

/** SDD phases (English — they feed AI-facing commands/skills), filtered to the ones this config uses. */
export function phasesFor(config: Config): Phase[] {
  const all = strings("en").phases;
  if (usesConstitution(config)) return all;
  return all.filter((p) => p.name !== "sdd-constitution");
}

// AI-facing slash command → English only (token efficiency).
// Claude command = a THIN launcher (0012a): the skill carries the substance, so the command just points to
// it — no duplicated guidance (fixes the command⟂skill overlap).
function commandFile(p: Phase, config: Config): string {
  const backend = config.sdd.backend;
  const store = docsPaths(config);
  return [
    "---",
    `description: ${p.summary}`,
    "---",
    "",
    `# /${aiwsId(p.name)}`,
    "",
    `Run the **\`${aiwsId(p.name)}\`** skill — it carries the inputs to read, the \`${p.produces?.file ?? `${p.name.replace("sdd-", "")}.md`}\` template, and the quality bar for this phase.`,
    "",
    backend === "none"
      ? "> Backend `none`: artifacts are not persisted to disk."
      : `> Artifacts are versioned in \`${store.development}/\` and reviewed in PRs.`,
    backend === "hybrid"
      ? "> If engram is available, also persist a summary to cross-session memory; the in-repo files remain canonical."
      : "",
  ].filter((l) => l !== "").join("\n");
}

// Copilot has no skill to launch, so the prompt stays SUBSTANTIVE — but derived from the same Phase data
// (purpose + produce template + quality), not a thin near-duplicate of the command.
function copilotPrompt(p: Phase, config: Config): string {
  const lines = ["---", "mode: agent", `description: ${p.summary}`, "---", "", p.description ?? p.does, ""];
  if (p.produces) {
    lines.push(`## Produce — \`${p.produces.file}\``, ...p.produces.sections.map((s) => `- ${s}`), "");
  }
  if (p.quality?.length) {
    lines.push("## Quality bar", ...p.quality.map((q) => `- [ ] ${q}`), "");
  }
  lines.push("Follow the SDD lifecycle documented in `AGENTS.md`.");
  return lines.join("\n");
}

// /sdd-sync — SPDD code→prompt sync (a maintenance command, not a phase). Claude target, methodology spdd.
function syncCommand(config: Config): string {
  const store = docsPaths(config);
  return [
    "---",
    "description: SPDD sync — fold non-behavioural code changes back into the REASONS Canvas (code→prompt).",
    "---",
    "",
    "# /aiws-sdd-sync",
    "",
    "Run the **aiws-sdd-spec-sync** skill: compare the code against the active REASONS Canvas, report drift, and",
    "**propose** folding non-behavioural changes back into the affected Canvas sections. Propose-and-review —",
    "no edits to spec or code without your approval.",
    "",
    "> **Logic/behaviour changes go the other way:** *fix the prompt first*, then propagate with",
    "> **aiws-sdd-code-maintenance**. This command is for code-side, non-behavioural drift only.",
    "",
    `> Canvas lives in \`${store.specs}/\`; record the sync under \`${store.changes}/<change>/\`.`,
  ].join("\n");
}

function projectSeed(config: Config): string {
  const s = docsPaths(config);
  return config.language === "es"
    ? `# Estado del proyecto (SDD)

> Registro canónico, en el repo, de convenciones y specs actuales para el flujo SDD.
> Creado por ai-workspace. Edítalo libremente.
>
> Este almacén usa la *disposición* de OpenSpec (specs + changes + archive) como **convención** —
> no es una dependencia del CLI de OpenSpec. Los artefactos son Markdown plano y legibles por
> cualquier IA. Ver \`AGENTS.md\` → sección SDD.

## Convenciones
Ver \`AGENTS.md\` (fuente única de verdad).

## Specs
Las especificaciones estables viven en \`${s.specs}/\`. Los cambios activos en \`${s.changes}/\`.
`
    : `# Project state (SDD)

> Canonical, in-repo record of project conventions and current specs for the SDD flow.
> Created by ai-workspace. Edit freely.
>
> This store uses OpenSpec's *layout* (specs + changes + archive) as a **convention** — it is not a
> dependency on the OpenSpec CLI. Artifacts are plain Markdown, readable by any AI tool.
> See \`AGENTS.md\` → SDD section.

## Conventions
See \`AGENTS.md\` (single source of truth).

## Specs
Stable specifications live in \`${s.specs}/\`. Active changes live in \`${s.changes}/\`.
`;
}

/** Greenfield bootstrap seed (Spec-Kit idea, OpenSpec layout). Written only for new projects. */
function constitutionSeed(config: Config): string {
  const s = docsPaths(config);
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

> Las specs (\`${s.specs}/\`) y los cambios (\`${s.changes}/\`) deben respetar esta constitución.
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

> Specs (\`${s.specs}/\`) and changes (\`${s.changes}/\`) must honor this constitution.
`;
}

/** Scaffold the SDD module: slash commands, optional Copilot prompts, and the spec store. */
export function generateSdd(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.sdd.enabled) return results;
  const phases = phasesFor(config);
  const store = docsPaths(config);

  if (config.targets.includes("claude")) {
    for (const p of phases) {
      results.push(writeFile(resolve(cwd, `.claude/commands/${aiwsId(p.name)}.md`), commandFile(p, config)));
    }
    // SPDD adds the code→prompt sync command (the closed loop); the prompt→code half reuses aiws-sdd-code-maintenance.
    if (config.sdd.methodology === "spdd") {
      results.push(writeFile(resolve(cwd, ".claude/commands/aiws-sdd-sync.md"), syncCommand(config)));
    }
  }
  if (config.targets.includes("copilot")) {
    for (const p of phases) {
      results.push(writeFile(resolve(cwd, `.github/prompts/${aiwsId(p.name)}.prompt.md`), copilotPrompt(p, config)));
    }
  }

  if (config.sdd.backend !== "none") {
    results.push(writeIfMissing(resolve(cwd, store.readme), projectSeed(config)));
    results.push(writeIfMissing(resolve(cwd, `${store.specs}/.gitkeep`), ""));
    results.push(writeIfMissing(resolve(cwd, `${store.changes}/.gitkeep`), ""));
    if (usesConstitution(config)) {
      results.push(writeIfMissing(resolve(cwd, store.constitution), constitutionSeed(config)));
    }
  }

  return results;
}
