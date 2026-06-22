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
  /**
   * Rich, AI-facing phase data (English-only) — feeds the generated SKILL.md so it sits at the "right
   * altitude" (Agent Skills + context-engineering best practices; see 0012a). Optional so the ES phase
   * list and any other consumer stay valid; populated for the English phases that drive skills/commands.
   */
  /** Intent-based, 3rd-person "what it does AND when to use it" (replaces the circular trigger). */
  description?: string;
  /** Inputs to read first (prior change artifacts). */
  reads?: string[];
  /** The artifact this phase writes: a file + its section template. */
  produces?: { file: string; sections: string[] };
  /** The quality checklist the artifact must pass before moving to the next phase. */
  quality?: string[];
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
    manifest: string;
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
    opencodeConfig:
      "MCP servers for OpenCode (.opencode/opencode.json; AGENTS.md + .claude/skills are read natively).",
    tsInstructions: "Path-scoped Copilot rules for TypeScript files.",
    editorconfig: "Editor formatting & encoding (UTF-8/LF).",
    gitattributes: "Git line-ending normalization.",
    ignore: "AI-context / git ignore (managed).",
    sdd: "SDD methodology: commands + spec store (Markdown in the repo, no external CLI).",
    skill: "Vendored skill (.claude/skills/).",
    livingDocs: "Living docs: /aiws-doc-sync + project state.",
    onboarding: "Onboarding: index of the AI workspace.",
    vscodeExtensions: "Recommended VS Code extensions.",
    manifest: "Integrity manifest of base-owned artifacts.",
  },
  phases: [
    {
      name: "sdd-constitution",
      summary: "Establish project principles (greenfield bootstrap).",
      does: "Capture the project's non-negotiable principles and guardrails in the project's `constitution.md`. Do this once when a project is born; later specs and designs must honor it. (Idea borrowed from Spec-Kit; only for new projects.)",
      description:
        "Capture a new project's non-negotiable principles (test-first, simplicity, anti-abstraction, integration-first) in a constitution every later spec must honour. Use once, at the birth of a greenfield project — not for existing repos or per-feature work.",
      reads: ["the project's goals and constraints", "any existing house style or org conventions"],
      produces: {
        file: "constitution.md",
        sections: [
          "Principles (numbered, each with a one-line rationale)",
          "Constraints",
          "Amendment rule (rationale + approval required)",
        ],
      },
      quality: [
        "Each principle is testable, not a platitude",
        "Numbered and stable (amendments are deliberate)",
        "No feature specifics — only durable rules",
      ],
    },
    {
      name: "sdd-explore",
      summary: "Investigate before committing to a change.",
      does: "Clarify the problem, survey the code, list open questions and options. Write findings to the change's `explore.md`.",
      description:
        "Investigate a feature or bug before committing to an approach: frame the problem, survey the relevant code, and lay out options with trade-offs. Use at the very start of a non-trivial change, when the problem or solution space is still unclear.",
      reads: [
        "the request / issue",
        "the relevant modules and their tests",
        "related prior changes in the archive",
      ],
      produces: {
        file: "explore.md",
        sections: [
          "Problem (grounded in the code)",
          "Current reality",
          "Open questions",
          "Options with trade-offs",
          "Recommendation",
        ],
      },
      quality: [
        "Claims cite real files/symbols, not assumptions",
        "At least two options weighed",
        "Open questions are explicit, not glossed over",
      ],
    },
    {
      name: "sdd-propose",
      summary: "Create a change proposal.",
      does: "State intent, scope, approach and risks in the change's `proposal.md`.",
      description:
        "Turn an explored idea into a reviewable proposal: state the why, the scope (in and out), the approach, and the risks. Use once exploration converges and before writing the spec — it is the decision artifact a reviewer signs off.",
      reads: ["explore.md", "the constitution / AGENTS.md guard-rails"],
      produces: {
        file: "proposal.md",
        sections: ["Why", "What (scope: in / out)", "Approach", "Decisions to confirm", "Risks"],
      },
      quality: [
        "Scope boundaries are explicit (what it will NOT do)",
        "Any plausible-alternative decision is surfaced, not assumed",
        "Risks name a mitigation",
      ],
    },
    {
      name: "sdd-clarify",
      summary: "Resolve ambiguities before writing the spec.",
      does: "Ask targeted questions about underspecified areas and record the decisions in the change's `clarify.md`, so the spec that follows is unambiguous. (Idea borrowed from Spec-Kit.)",
      description:
        "Surface and resolve ambiguity before the spec is written: ask targeted questions about underspecified behaviour, edge cases and decisions, and record the answers. Use between proposal and spec whenever the proposal leaves choices open.",
      reads: ["proposal.md", "explore.md", "any `[NEEDS CLARIFICATION]` markers"],
      produces: {
        file: "clarify.md",
        sections: ["Questions (each with options + a recommendation)", "Decisions (the chosen answer + why)"],
      },
      quality: [
        "Each question changes what the spec would say",
        "Decisions are concrete enough to remove the ambiguity",
        "No open `[NEEDS CLARIFICATION]` left for the spec",
      ],
    },
    {
      name: "sdd-spec",
      summary: "Write requirements & scenarios (delta spec).",
      does: "Capture WHAT must be true in the change's `spec.md`. Requirements with acceptance scenarios.",
      description:
        "Specify WHAT must be true as a delta against the current specs — testable requirements and acceptance scenarios in the OpenSpec delta format. Use after clarify; the spec, not the code, is the source of truth for behaviour. Avoid HOW (that is design).",
      reads: ["proposal.md", "clarify.md", "the current `specs/` baseline this change deltas"],
      produces: {
        file: "spec.md",
        sections: [
          "Delta headers: `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements`",
          "Under each: `### Requirement: <name>` stating the rule in RFC 2119 terms (MUST / SHOULD / MAY)",
          "Each requirement has `#### Scenario: <name>` — GIVEN … WHEN … THEN …",
          "`[NEEDS CLARIFICATION: …]` inline for anything still open",
          "Success criteria (measurable, SC-001…)",
          "Out of scope",
        ],
      },
      quality: [
        "Uses the ADDED/MODIFIED/REMOVED delta format against the current `specs/`",
        "Every requirement is verifiable and uses an RFC 2119 keyword",
        "Each requirement has at least one Given/When/Then scenario",
        "No open `[NEEDS CLARIFICATION]` remain; success criteria are measurable; describes WHAT, never HOW",
      ],
    },
    {
      name: "sdd-design",
      summary: "Technical design & architecture decisions.",
      does: "Capture HOW in the change's `design.md`, with Mermaid diagrams where useful.",
      description:
        "Decide HOW the spec is met: the technical approach, the key architecture decisions and their trade-offs, with Mermaid diagrams where they clarify. Use after the spec is stable, before breaking work into tasks.",
      reads: ["spec.md", "the existing architecture (`ARCHITECTURE.md`) and affected modules"],
      produces: {
        file: "design.md",
        sections: [
          "Approach",
          "Architecture decisions (option chosen + why)",
          "Diagrams (Mermaid, quoted labels)",
          "Data / contracts",
          "Trade-offs & complexity",
        ],
      },
      quality: [
        "Every spec requirement is covered by the design",
        "Decisions record the rejected alternatives",
        "Diagram labels with special chars are quoted",
        "No gold-plating beyond the spec",
      ],
    },
    {
      name: "sdd-tasks",
      summary: "Break the change into a task checklist.",
      does: "Derive an ordered checklist from spec + design into the change's `tasks.md`.",
      description:
        "Break the spec and design into an ordered, checkable task list — small, verifiable steps that map back to requirements. Use once spec and design are agreed, to drive (and track) implementation.",
      reads: ["spec.md", "design.md"],
      produces: {
        file: "tasks.md",
        sections: [
          "Ordered tasks (checkboxes)",
          "[P] markers for parallelizable work",
          "Each task traces to a requirement",
        ],
      },
      quality: [
        "Tasks are small and independently verifiable",
        "Order respects real dependencies",
        "Together they cover every requirement",
      ],
    },
    {
      name: "sdd-apply",
      summary: "Implement tasks following spec & design.",
      does: "Implement tasks in order, checking them off in `tasks.md`. Keep code aligned with the spec.",
      description:
        "Implement the tasks in order, keeping the code aligned with the spec and design, checking each off as it lands. Use to execute an agreed plan — if reality diverges from the spec, stop and update the spec first.",
      reads: ["tasks.md", "spec.md", "design.md"],
      produces: {
        file: "tasks.md (kept current)",
        sections: [
          "Tasks checked off as completed",
          "Notes on any deviation (with the spec updated to match)",
        ],
      },
      quality: [
        "Code matches the spec — divergence updates the spec, not silently the code",
        "Tests accompany behaviour",
        "Each task checked off only when actually done",
      ],
    },
    {
      name: "sdd-verify",
      summary: "Validate implementation against spec.",
      does: "Check each requirement/scenario; report gaps in the change's `verify-report.md`.",
      description:
        "Validate the implementation against the spec: walk every requirement and acceptance scenario, run the checks, and report any gaps. Use after apply, before archiving — it is the evidence the change is actually done.",
      reads: ["spec.md (requirements + scenarios)", "the implemented code and its tests"],
      produces: {
        file: "verify-report.md",
        sections: [
          "Per-requirement result (pass / fail / partial)",
          "Evidence (tests, output)",
          "Gaps and follow-ups",
        ],
      },
      quality: [
        "Every requirement and scenario is checked",
        "Failures are reported honestly with the evidence",
        "No requirement marked done without proof",
      ],
    },
    {
      name: "sdd-archive",
      summary: "Fold the change into main specs and archive.",
      does: "Merge the delta spec into the stable specs, then move the change folder to the archive.",
      description:
        "Fold a verified change's delta into the stable specs and move its folder to the archive. Use only after verify passes: ADDED requirements are appended, MODIFIED replace, REMOVED delete; then the change is archived with its full history.",
      reads: ["verify-report.md (must pass)", "spec.md delta", "the target `specs/` baseline"],
      produces: {
        file: "specs/ (updated) + archive/<date-name>/",
        sections: [
          "Apply delta: ADDED→append, MODIFIED→replace, REMOVED→delete",
          "Move the change folder to the archive (full context preserved)",
        ],
      },
      quality: [
        "Verify passed before archiving",
        "Delta merge rules applied exactly",
        "Stable specs remain internally consistent after merge",
      ],
    },
  ],
};

const es: Strings = {
  scopeHeader: "Gestionado por ai-workspace — edita workspace.config.yaml (scope:) y ejecuta sync.",
  docSyncReminder:
    "Recordatorio: ejecuta /aiws-doc-sync para refrescar las docs vivas si cambió el estado del proyecto.",
  desc: {
    agents: "Fuente única de verdad para todos los agentes de IA.",
    claudeAdapter: "Adaptador de Claude Code (importa @AGENTS.md).",
    claudeMcp: "Servidores MCP para Claude Code.",
    claudeSettings: "Ajustes de Claude Code (permisos, hooks, env).",
    copilot: "Instrucciones de Copilot para el repo (espejo de AGENTS.md).",
    vscodeMcp: "Servidores MCP para VS Code / Copilot.",
    codexConfig: "Servidores MCP para Codex (.codex/config.toml; AGENTS.md son sus instrucciones).",
    opencodeConfig:
      "Servidores MCP para OpenCode (.opencode/opencode.json; AGENTS.md y .claude/skills se leen de forma nativa).",
    tsInstructions: "Reglas de Copilot con ámbito para ficheros TypeScript.",
    editorconfig: "Formato y codificación del editor (UTF-8/LF).",
    gitattributes: "Normalización de fin de línea en Git.",
    ignore: "Exclusiones de contexto IA / git (gestionadas).",
    sdd: "Metodología SDD: comandos + almacén de specs (Markdown en el repo, sin CLI externo).",
    skill: "Skill vendorizada (.claude/skills/).",
    livingDocs: "Docs vivas: /aiws-doc-sync + estado del proyecto.",
    onboarding: "Onboarding: índice del workspace de IA.",
    vscodeExtensions: "Extensiones recomendadas de VS Code.",
    manifest: "Manifiesto de integridad de los artefactos base.",
  },
  phases: [
    {
      name: "sdd-constitution",
      summary: "Establecer los principios del proyecto (arranque greenfield).",
      does: "Captura los principios y límites no-negociables del proyecto en el `constitution.md` del proyecto. Hazlo una sola vez al nacer el proyecto; las specs y diseños posteriores deben respetarlo. (Idea tomada de Spec-Kit; solo para proyectos nuevos.)",
    },
    {
      name: "sdd-explore",
      summary: "Investigar antes de comprometerse a un cambio.",
      does: "Aclara el problema, revisa el código, lista preguntas abiertas y opciones. Escribe los hallazgos en el `explore.md` del cambio.",
    },
    {
      name: "sdd-propose",
      summary: "Crear una propuesta de cambio.",
      does: "Indica intención, alcance, enfoque y riesgos en el `proposal.md` del cambio.",
    },
    {
      name: "sdd-clarify",
      summary: "Resolver ambigüedades antes de escribir la spec.",
      does: "Haz preguntas concretas sobre las zonas poco definidas y registra las decisiones en el `clarify.md` del cambio, para que la spec resultante no tenga ambigüedades. (Idea tomada de Spec-Kit.)",
    },
    {
      name: "sdd-spec",
      summary: "Escribir requisitos y escenarios (delta spec).",
      does: "Captura QUÉ debe cumplirse en el `spec.md` del cambio. Requisitos con escenarios de aceptación.",
    },
    {
      name: "sdd-design",
      summary: "Diseño técnico y decisiones de arquitectura.",
      does: "Captura el CÓMO en el `design.md` del cambio, con diagramas Mermaid cuando aporten.",
    },
    {
      name: "sdd-tasks",
      summary: "Desglosar el cambio en una checklist de tareas.",
      does: "Deriva una checklist ordenada desde spec + design en el `tasks.md` del cambio.",
    },
    {
      name: "sdd-apply",
      summary: "Implementar las tareas siguiendo spec y design.",
      does: "Implementa las tareas en orden, marcándolas en `tasks.md`. Mantén el código alineado con la spec.",
    },
    {
      name: "sdd-verify",
      summary: "Validar la implementación contra la spec.",
      does: "Comprueba cada requisito/escenario; reporta huecos en el `verify-report.md` del cambio.",
    },
    {
      name: "sdd-archive",
      summary: "Integrar el cambio en las specs principales y archivar.",
      does: "Funde la delta spec en las specs estables, y mueve la carpeta del cambio al archivo.",
    },
  ],
};

const TABLE: Record<Locale, Strings> = { es, en };

export function strings(locale: string): Strings {
  return TABLE[locale as Locale] ?? en;
}
