import { basename } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import {
  intro,
  outro,
  text,
  select,
  multiselect,
  confirm,
  isCancel,
  cancel,
  note,
  log,
} from "@clack/prompts";
import { saveConfig, configExists } from "../config/loader.js";
import { detectStack } from "../detect/stack.js";
import { generate } from "../generate/index.js";
import { routedSkills } from "../generate/skillRouting.js";
import { availablePacks } from "../generate/stackPacks.js";
import { catalog, type ModuleEntry } from "../modules/registry.js";
import { printArtifacts } from "../util/report.js";
import { buildConfig, simpleDefaults, type WizardInputs } from "./wizard.js";

interface InitOptions {
  from?: string[];
  yes?: boolean;
  simple?: boolean;
  advanced?: boolean;
}

function bail(value: unknown): asserts value {
  if (isCancel(value)) {
    cancel("Cancelled. Nothing was written.");
    process.exit(0);
  }
}

function detectName(cwd: string): string {
  const pkgPath = resolve(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const name = JSON.parse(readFileSync(pkgPath, "utf8")).name;
      if (typeof name === "string" && name) return name.replace(/^@[^/]+\//, "");
    } catch {
      /* ignore */
    }
  }
  return basename(cwd);
}

/** Wizard options come from the module registry — the single source for stack modules (no hardcoded lists). */
const toOption = (m: ModuleEntry) => ({ value: m.id, label: m.label });

export async function runInit(cwd: string, options: InitOptions = {}): Promise<void> {
  intro(pc.bgCyan(pc.black(" ai-workspace init ")));

  if (configExists(cwd)) {
    const overwrite = await confirm({
      message: "workspace.config.yaml already exists. Re-run the wizard and overwrite it?",
      initialValue: false,
    });
    bail(overwrite);
    if (!overwrite) {
      log.info("Keeping existing config. Run `ai-workspace sync` to regenerate artifacts.");
      outro("Done.");
      return;
    }
  }

  const detected = detectStack(cwd);
  if (detected.notes.length) {
    note(detected.notes.join("\n"), "Stack detection");
  }

  // Setup mode. The richest path is the AI-guided `configure-workspace` skill (/configure); for the manual
  // wizard, Simple = few questions + smart defaults (accept the detected stack), Advanced = fully parametrized.
  let mode: "simple" | "advanced";
  if (options.advanced) mode = "advanced";
  else if (options.simple || options.yes) mode = "simple";
  else {
    const m = await select({
      message: "Setup mode / Modo de configuración",
      options: [
        { value: "simple", label: "Simple (recommended)", hint: "pocas preguntas + defaults; acepta el stack detectado" },
        { value: "advanced", label: "Advanced / Avanzado", hint: "controla todas las capas" },
      ],
      initialValue: "simple",
    });
    bail(m);
    mode = m as "simple" | "advanced";
    note("For the richest setup, run the configure-workspace skill (/configure) and let the AI propose your config.", "AI-guided (recommended)");
  }

  let inputs: WizardInputs;

  if (mode === "advanced") {
  const language = await select({
    message: "Language for generated docs & instructions / Idioma de la documentación generada",
    options: [
      { value: "es", label: "Español", hint: "recomendado para el equipo" },
      { value: "en", label: "English" },
    ],
    initialValue: "es",
  });
  bail(language);

  const name = await text({
    message: "Project name",
    initialValue: detectName(cwd),
    validate: (v) => (v?.trim() ? undefined : "Required"),
  });
  bail(name);

  const description = await text({
    message: "Short description (optional)",
    placeholder: "What this project does",
    defaultValue: "",
  });
  bail(description);

  const detectedExisting = detected.languages.length > 0 || detected.frameworks.length > 0;
  const projectMode = await select({
    message: "Project type / Tipo de proyecto",
    options: [
      { value: "new", label: "New / Nuevo", hint: "usa versiones estables actuales" },
      { value: "existing", label: "Existing / Existente", hint: "conserva versiones; sube solo con evaluación" },
    ],
    initialValue: detectedExisting ? "existing" : "new",
  });
  bail(projectMode);

  // Profile: two orthogonal dimensions that drive governance posture. This is an explicit choice — detection
  // seeds the STACK, not the profile, so the default must not be keyed off `detectedExisting` (that mislabels
  // users). `technical` is the neutral default for a dev tool; the hint makes the decoupling explicit.
  note("Detection seeds the stack only — your user type & experience are your choice (they set the governance posture).", "Profile / Perfil");
  const userType = await select({
    message: "User type / Tipo de usuario",
    options: [
      { value: "technical", label: "Technical / Técnico", hint: "desarrollo, devops, datos, sistemas, infra" },
      { value: "business", label: "Business / Negocio", hint: "procesos, documentación, análisis, gestión" },
    ],
    initialValue: "technical",
  });
  bail(userType);

  const experience = await select({
    message: "Experience level / Nivel de experiencia",
    options: [
      { value: "beginner", label: "Beginner / Aprendiz", hint: "guía clara, pocas decisiones, caminos seguros" },
      { value: "standard", label: "Standard / Autónomo", hint: "equilibrio entre guía y flexibilidad" },
      { value: "advanced", label: "Advanced / Experto", hint: "más análisis, trade-offs y autonomía" },
    ],
    initialValue: "standard",
  });
  bail(experience);

  const company = await select({
    message: "Organization overlay / Overlay de empresa",
    options: [
      { value: "none", label: "None / Genérico", hint: "uso personal o sin empresa (recomendado)" },
      { value: "example", label: "Example Co (plantilla)", hint: "overlay de empresa de ejemplo — renómbralo/extiéndelo" },
    ],
    initialValue: "none",
  });
  bail(company);

  const targets = await multiselect({
    message: "Which AI tools should this workspace target?",
    options: [
      { value: "claude", label: "Claude Code", hint: "CLAUDE.md, skills, .mcp.json" },
      { value: "copilot", label: "GitHub Copilot", hint: ".github/* (works in VS Code & Visual Studio)" },
      { value: "codex", label: "OpenAI Codex", hint: "AGENTS.md + .codex/config.toml" },
    ],
    initialValues: ["claude", "copilot"],
    required: true,
  });
  bail(targets);

  const langDefaults = detected.languages.length
    ? detected.languages.map((l) => l.id)
    : ["typescript"];
  const langIds = await multiselect({
    message: "Languages",
    options: catalog("language").map(toOption),
    initialValues: langDefaults,
    required: true,
  });
  bail(langIds);

  const fwDefaults = detected.frameworks.map((f) => f.id);
  const fwIds = await multiselect({
    message: "Frameworks (optional)",
    options: catalog("framework").map(toOption),
    initialValues: fwDefaults,
    required: false,
  });
  bail(fwIds);

  const envDefaults = detected.environments.map((e) => e.id);
  const envIds = await multiselect({
    message: "Environments / tooling (optional)",
    options: catalog("environment").map(toOption),
    initialValues: envDefaults,
    required: false,
  });
  bail(envIds);

  const sddEnabled = await confirm({
    message: "Include Spec-Driven Development (SDD)? / ¿Incluir desarrollo guiado por specs (SDD)?",
    initialValue: true,
  });
  bail(sddEnabled);

  // Everything below has a best-practice default, so the common path skips four prompts. Only ask when the
  // user opts to customize. Defaults: build software, SDD artifacts in files, living docs + context7 on.
  let purpose: "build" | "learn" = "build";
  let sddBackend: "files" | "hybrid" | "none" = "files";
  let sddMethodology: "sdd" | "spdd" = "sdd";
  let livingDocs = true;
  let useContext7 = true;
  let safetyGuard: "warn" | "block" | "off" = "off";
  let vscode = true;

  const customize = await confirm({
    message: "Customize advanced options? / ¿Ajustar opciones avanzadas? (purpose · SDD storage · living docs · context7)",
    initialValue: false,
  });
  bail(customize);

  if (customize) {
    const purposeChoice = await select({
      message: "Workspace purpose / Propósito",
      options: [
        { value: "build", label: "Build / Construir software", hint: "el caso normal" },
        { value: "learn", label: "Learn / Aprender", hint: "modo tutor: ejercicios y explicaciones" },
      ],
      initialValue: "build",
    });
    bail(purposeChoice);
    purpose = purposeChoice as typeof purpose;

    // The SDD flow is a *methodology* that borrows ideas from two tools — it does NOT depend on their
    // CLIs. The "backend" only chooses where the (plain-Markdown) artifacts are stored.
    if (sddEnabled) {
      note(
        projectMode === "new"
          ? "SDD method: Spec-Kit-style bootstrap (constitution + clarify) for this new project, then OpenSpec-style delta changes (specs/ + changes/ + archive/) as it evolves. Concepts only — no external CLI."
          : "SDD method: OpenSpec-style delta changes (specs/ + changes/ + archive/) for every new feature in this existing project. Concepts only — no external CLI (no constitution bootstrap for existing repos).",
        "How SDD works here / Cómo funciona SDD aquí",
      );
      const backend = await select({
        message: "Where should SDD artifacts live? / ¿Dónde se guardan los artefactos SDD?",
        options: [
          { value: "files", label: "Files in repo (OpenSpec layout)", hint: "recomendado — portable, versionado en git, sin dependencias" },
          { value: "hybrid", label: "Files + cross-session memory (engram)", hint: "añade memoria entre sesiones si está disponible; los ficheros siguen siendo canónicos" },
          { value: "none", label: "Inline only", hint: "en la conversación, no se persisten" },
        ],
        initialValue: "files",
      });
      bail(backend);
      sddBackend = backend as typeof sddBackend;

      // Methodology is an advanced choice (progressive disclosure): most repos want plain SDD.
      if (experience === "advanced") {
        const method = await select({
          message: "Methodology / Metodología",
          options: [
            { value: "sdd", label: "Spec-Driven (SDD)", hint: "recomendado — spec → diseño → tareas → código" },
            { value: "spdd", label: "Structured-Prompt-Driven (SPDD)", hint: "el prompt (REASONS Canvas) es un artefacto versionado; implica schema reasons" },
          ],
          initialValue: "sdd",
        });
        bail(method);
        sddMethodology = method as typeof sddMethodology;
      }
    }

    const ld = await confirm({
      message: "Add autonomous living docs (/doc-sync + project state)?",
      initialValue: true,
    });
    bail(ld);
    livingDocs = ld === true;

    const c7 = await confirm({
      message: "Configure context7 MCP (up-to-date library docs — to CONSUME docs, not build MCP servers)?",
      initialValue: true,
    });
    bail(c7);
    useContext7 = c7 === true;

    const vsc = await confirm({
      message: "Generate .vscode/ recommendations (extensions/settings/mcp)? Turn off for Visual Studio / non-VS-Code.",
      initialValue: true,
    });
    bail(vsc);
    vscode = vsc === true;

    // Safety guard: a PreToolUse Bash hook that hardens the Safety gate (Claude only). Opt-in; default
    // `warn` for new projects (non-disruptive), off for existing (don't touch their flow).
    const guard = await select({
      message: "Safety guard hook (avisa antes de comandos peligrosos: force-push, rm -rf, migraciones)?",
      options: [
        { value: "warn", label: "Warn", hint: "pide confirmación (recomendado)" },
        { value: "block", label: "Block", hint: "los bloquea" },
        { value: "off", label: "Off", hint: "solo la regla en AGENTS.md" },
      ],
      initialValue: projectMode === "new" ? "warn" : "off",
    });
    bail(guard);
    safetyGuard = guard as typeof safetyGuard;
  }

  inputs = {
    name: String(name),
    description: String(description),
    language: language as "es" | "en",
    mode: projectMode as "new" | "existing",
    purpose,
    userType: userType as "business" | "technical",
    experience: experience as "beginner" | "standard" | "advanced",
    company: company as "none" | "example",
    targets: targets as ("claude" | "copilot" | "codex")[],
    vscode,
    langIds: langIds as string[],
    fwIds: fwIds as string[],
    envIds: envIds as string[],
    sddEnabled: Boolean(sddEnabled),
    sddBackend,
    sddMethodology,
    livingDocs,
    useContext7,
    safetyGuard,
    from: options.from,
  };
  } else {
    // Simple: name + docs language + targets; accept the detected stack; defaults for everything else.
    const sName = await text({
      message: "Project name",
      initialValue: detectName(cwd),
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    bail(sName);
    const sLang = await select({
      message: "Language for generated docs & instructions / Idioma de la documentación generada",
      options: [
        { value: "es", label: "Español", hint: "recomendado para el equipo" },
        { value: "en", label: "English" },
      ],
      initialValue: "es",
    });
    bail(sLang);
    const sTargets = await multiselect({
      message: "Which AI tools should this workspace target?",
      options: [
        { value: "claude", label: "Claude Code", hint: "CLAUDE.md, skills, .mcp.json" },
        { value: "copilot", label: "GitHub Copilot", hint: ".github/* (works in VS Code & Visual Studio)" },
        { value: "codex", label: "OpenAI Codex", hint: "AGENTS.md + .codex/config.toml" },
      ],
      initialValues: ["claude", "copilot"],
      required: true,
    });
    bail(sTargets);
    // Profile is an explicit choice even in Simple mode — detection seeds the stack, never the governance
    // posture. Two quick prompts replace the old silent guess (which mislabeled users as technical/business).
    const sUserType = await select({
      message: "User type / Tipo de usuario",
      options: [
        { value: "technical", label: "Technical / Técnico", hint: "desarrollo, devops, datos, sistemas, infra" },
        { value: "business", label: "Business / Negocio", hint: "procesos, documentación, análisis, gestión" },
      ],
      initialValue: "technical",
    });
    bail(sUserType);
    const sExperience = await select({
      message: "Experience level / Nivel de experiencia",
      options: [
        { value: "beginner", label: "Beginner / Aprendiz", hint: "guía clara, pocas decisiones, caminos seguros" },
        { value: "standard", label: "Standard / Autónomo", hint: "equilibrio entre guía y flexibilidad" },
        { value: "advanced", label: "Advanced / Experto", hint: "más análisis, trade-offs y autonomía" },
      ],
      initialValue: "standard",
    });
    bail(sExperience);
    const fmt = (a: { id: string }[]) => a.map((x) => x.id).join(", ") || "—";
    note(
      `Languages: ${fmt(detected.languages)}\nFrameworks: ${fmt(detected.frameworks)}\nEnvironments: ${fmt(detected.environments)}\n\nDefaults: build · SDD (files) · living docs · context7 · company none. Confirm at the end.`,
      "Using detected stack (Simple) / Stack detectado",
    );
    inputs = simpleDefaults(detected, {
      name: String(sName),
      language: sLang as "es" | "en",
      targets: sTargets as ("claude" | "copilot" | "codex")[],
      userType: sUserType as "business" | "technical",
      experience: sExperience as "beginner" | "standard" | "advanced",
      from: options.from,
    });
  }

  const config = buildConfig(inputs, detected);

  // Skill selection: offer the available *library* packs (recommended pre-checked) with a description each, so
  // the choices are explicit. Beginners skip this (keep the recommended set — fewer questions). Saved as
  // `config.skills` (empty = all recommended). Core/feature skills (commit, SDD phases, living-docs, corp/sdd
  // bundles) are governed by their own flags, not this list.
  if (mode === "advanced" && config.targets.includes("claude") && inputs.experience !== "beginner") {
    const packs = availablePacks(config);
    if (packs.length) {
      const chosen = await multiselect({
        message: "Library skills to install (recommended pre-selected) / Skills de biblioteca a instalar",
        options: packs.map((p) => ({ value: p.id, label: p.id, hint: p.description })),
        initialValues: packs.map((p) => p.id),
        required: false,
      });
      bail(chosen);
      // Keep the list empty when everything stays selected (open to new recommended packs); else pin the subset.
      config.skills = (chosen as string[]).length === packs.length ? [] : (chosen as string[]);
    }
  }

  // Preview the final skill set (core + selected library) so it is concrete before anything is written.
  if (config.targets.includes("claude")) {
    const skills = routedSkills(config);
    if (skills.length) {
      note(
        skills.map((s) => `• ${s.id} — ${s.trigger[config.language]} (${s.load})`).join("\n"),
        `Skills for this workspace (${skills.length}) / Skills de este workspace`,
      );
    }
  }
  const proceed = await confirm({
    message: "Generate the workspace with these settings? / ¿Generar el workspace con esta configuración?",
    initialValue: true,
  });
  bail(proceed);
  if (!proceed) {
    cancel("Cancelled. Nothing was written.");
    return;
  }

  saveConfig(cwd, config);
  log.success("Wrote workspace.config.yaml");

  if (config.ingest.sources.length) {
    note(
      `Recorded ingest sources: ${config.ingest.sources.join(", ")}\nRun \`ai-workspace import <path>\` to merge them (full ingestion lands in Phase 2).`,
      "Ingestion",
    );
  }

  console.log();
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);

  outro(pc.green("AI workspace ready. Open AI-WORKSPACE.md for the index."));
}
