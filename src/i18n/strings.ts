/**
 * Short, code-embedded strings localized per language. Long, document-like content
 * lives in templates under `templates/` (+ `templates/i18n/<locale>/` overrides),
 * which the Eta engine resolves by locale. This module is for the small labels.
 */

export type Locale = "es" | "en";

export interface Phase {
  name: string;
  summary: string;
  does: string;
}

export interface Strings {
  scopeHeader: string;
  docSyncReminder: string;
  /** Descriptions shown in the AI-WORKSPACE.md artifact index. */
  desc: {
    agents: string;
    claudeAdapter: string;
    claudeMcp: string;
    claudeSettings: string;
    copilot: string;
    vscodeMcp: string;
    codexConfig: string;
    opencodeConfig: string;
    tsInstructions: string;
    editorconfig: string;
    gitattributes: string;
    ignore: string;
    sdd: string;
    skill: string;
    livingDocs: string;
    onboarding: string;
    vscodeExtensions: string;
  };
  phases: Phase[];
}

const en: Strings = {
  scopeHeader: "Managed by ai-workspace — edit workspace.config.yaml (scope:) and run sync.",
  docSyncReminder: "Reminder: run /aiws-doc-sync to refresh the living docs if project state changed.",
  desc: {
    agents: "Single source of truth for all AI agents.",
    claudeAdapter: "Claude Code adapter (imports @AGENTS.md).",
    claudeMcp: "MCP servers for Claude Code.",
    claudeSettings: "Claude Code settings (permissions, hooks, env).",
    copilot: "Copilot repo-wide instructions (mirror of AGENTS.md).",
    vscodeMcp: "MCP servers for VS Code / Copilot.",
    codexConfig: "MCP servers for Codex (.codex/config.toml; AGENTS.md is its instructions).",
    opencodeConfig: "MCP servers for OpenCode (.opencode/opencode.json; AGENTS.md + .claude/skills are read natively).",
    tsInstructions: "Path-scoped Copilot rules for TypeScript files.",
    editorconfig: "Editor formatting & encoding (UTF-8/LF).",
    gitattributes: "Git line-ending normalization.",
    ignore: "AI-context / git ignore (managed).",
    sdd: "SDD methodology: commands + spec store (Markdown in the repo, no external CLI).",
    skill: "Vendored skill (.claude/skills/).",
    livingDocs: "Living docs: /aiws-doc-sync + project state.",
    onboarding: "Onboarding: index of the AI workspace.",
    vscodeExtensions: "Recommended VS Code extensions.",
  },
  phases: [
    { name: "sdd-constitution", summary: "Establish project principles (greenfield bootstrap).", does: "Capture the project's non-negotiable principles and guardrails in the project's `constitution.md`. Do this once when a project is born; later specs and designs must honor it. (Idea borrowed from Spec-Kit; only for new projects.)" },
    { name: "sdd-explore", summary: "Investigate before committing to a change.", does: "Clarify the problem, survey the code, list open questions and options. Write findings to the change's `explore.md`." },
    { name: "sdd-propose", summary: "Create a change proposal.", does: "State intent, scope, approach and risks in the change's `proposal.md`." },
    { name: "sdd-clarify", summary: "Resolve ambiguities before writing the spec.", does: "Ask targeted questions about underspecified areas and record the decisions in the change's `clarify.md`, so the spec that follows is unambiguous. (Idea borrowed from Spec-Kit.)" },
    { name: "sdd-spec", summary: "Write requirements & scenarios (delta spec).", does: "Capture WHAT must be true in the change's `spec.md`. Requirements with acceptance scenarios." },
    { name: "sdd-design", summary: "Technical design & architecture decisions.", does: "Capture HOW in the change's `design.md`, with Mermaid diagrams where useful." },
    { name: "sdd-tasks", summary: "Break the change into a task checklist.", does: "Derive an ordered checklist from spec + design into the change's `tasks.md`." },
    { name: "sdd-apply", summary: "Implement tasks following spec & design.", does: "Implement tasks in order, checking them off in `tasks.md`. Keep code aligned with the spec." },
    { name: "sdd-verify", summary: "Validate implementation against spec.", does: "Check each requirement/scenario; report gaps in the change's `verify-report.md`." },
    { name: "sdd-archive", summary: "Fold the change into main specs and archive.", does: "Merge the delta spec into the stable specs, then move the change folder to the archive." },
  ],
};

const es: Strings = {
  scopeHeader: "Gestionado por ai-workspace — edita workspace.config.yaml (scope:) y ejecuta sync.",
  docSyncReminder: "Recordatorio: ejecuta /aiws-doc-sync para refrescar las docs vivas si cambió el estado del proyecto.",
  desc: {
    agents: "Fuente única de verdad para todos los agentes de IA.",
    claudeAdapter: "Adaptador de Claude Code (importa @AGENTS.md).",
    claudeMcp: "Servidores MCP para Claude Code.",
    claudeSettings: "Ajustes de Claude Code (permisos, hooks, env).",
    copilot: "Instrucciones de Copilot para el repo (espejo de AGENTS.md).",
    vscodeMcp: "Servidores MCP para VS Code / Copilot.",
    codexConfig: "Servidores MCP para Codex (.codex/config.toml; AGENTS.md son sus instrucciones).",
    opencodeConfig: "Servidores MCP para OpenCode (.opencode/opencode.json; AGENTS.md y .claude/skills se leen de forma nativa).",
    tsInstructions: "Reglas de Copilot con ámbito para ficheros TypeScript.",
    editorconfig: "Formato y codificación del editor (UTF-8/LF).",
    gitattributes: "Normalización de fin de línea en Git.",
    ignore: "Exclusiones de contexto IA / git (gestionadas).",
    sdd: "Metodología SDD: comandos + almacén de specs (Markdown en el repo, sin CLI externo).",
    skill: "Skill vendorizada (.claude/skills/).",
    livingDocs: "Docs vivas: /aiws-doc-sync + estado del proyecto.",
    onboarding: "Onboarding: índice del workspace de IA.",
    vscodeExtensions: "Extensiones recomendadas de VS Code.",
  },
  phases: [
    { name: "sdd-constitution", summary: "Establecer los principios del proyecto (arranque greenfield).", does: "Captura los principios y límites no-negociables del proyecto en el `constitution.md` del proyecto. Hazlo una sola vez al nacer el proyecto; las specs y diseños posteriores deben respetarlo. (Idea tomada de Spec-Kit; solo para proyectos nuevos.)" },
    { name: "sdd-explore", summary: "Investigar antes de comprometerse a un cambio.", does: "Aclara el problema, revisa el código, lista preguntas abiertas y opciones. Escribe los hallazgos en el `explore.md` del cambio." },
    { name: "sdd-propose", summary: "Crear una propuesta de cambio.", does: "Indica intención, alcance, enfoque y riesgos en el `proposal.md` del cambio." },
    { name: "sdd-clarify", summary: "Resolver ambigüedades antes de escribir la spec.", does: "Haz preguntas concretas sobre las zonas poco definidas y registra las decisiones en el `clarify.md` del cambio, para que la spec resultante no tenga ambigüedades. (Idea tomada de Spec-Kit.)" },
    { name: "sdd-spec", summary: "Escribir requisitos y escenarios (delta spec).", does: "Captura QUÉ debe cumplirse en el `spec.md` del cambio. Requisitos con escenarios de aceptación." },
    { name: "sdd-design", summary: "Diseño técnico y decisiones de arquitectura.", does: "Captura el CÓMO en el `design.md` del cambio, con diagramas Mermaid cuando aporten." },
    { name: "sdd-tasks", summary: "Desglosar el cambio en una checklist de tareas.", does: "Deriva una checklist ordenada desde spec + design en el `tasks.md` del cambio." },
    { name: "sdd-apply", summary: "Implementar las tareas siguiendo spec y design.", does: "Implementa las tareas en orden, marcándolas en `tasks.md`. Mantén el código alineado con la spec." },
    { name: "sdd-verify", summary: "Validar la implementación contra la spec.", does: "Comprueba cada requisito/escenario; reporta huecos en el `verify-report.md` del cambio." },
    { name: "sdd-archive", summary: "Integrar el cambio en las specs principales y archivar.", does: "Funde la delta spec en las specs estables, y mueve la carpeta del cambio al archivo." },
  ],
};

const TABLE: Record<Locale, Strings> = { es, en };

export function strings(locale: string): Strings {
  return TABLE[(locale as Locale)] ?? en;
}
