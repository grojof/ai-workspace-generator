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
import { normalizeConfig, saveConfig, configExists } from "../config/loader.js";
import { detectStack } from "../detect/stack.js";
import { generate } from "../generate/index.js";
import { printArtifacts } from "../util/report.js";
import type { Config } from "../config/schema.js";
import { TEMPLATES_VERSION } from "../version.js";

interface InitOptions {
  from?: string[];
  yes?: boolean;
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

const KNOWN_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "go", label: "Go" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
];

const KNOWN_FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "express", label: "Express" },
  { value: "nestjs", label: "NestJS" },
];

const KNOWN_ENVIRONMENTS = [
  { value: "node-runtime", label: "Node + nvm" },
  { value: "python-venv", label: "Python venv" },
  { value: "wsl", label: "WSL" },
  { value: "docker", label: "Docker" },
  { value: "postgres", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL/MariaDB" },
  { value: "mongodb", label: "MongoDB" },
  { value: "odoo", label: "Odoo" },
];

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
    validate: (v) => (v.trim() ? undefined : "Required"),
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

  const targets = await multiselect({
    message: "Which AI tools should this workspace target?",
    options: [
      { value: "claude", label: "Claude Code", hint: "CLAUDE.md, skills, .mcp.json" },
      { value: "copilot", label: "GitHub Copilot", hint: ".github/*, .vscode/mcp.json" },
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
    options: KNOWN_LANGUAGES,
    initialValues: langDefaults,
    required: true,
  });
  bail(langIds);

  const fwDefaults = detected.frameworks.map((f) => f.id);
  const fwIds = await multiselect({
    message: "Frameworks (optional)",
    options: KNOWN_FRAMEWORKS,
    initialValues: fwDefaults,
    required: false,
  });
  bail(fwIds);

  const envDefaults = detected.environments.map((e) => e.id);
  const envIds = await multiselect({
    message: "Environments / tooling (optional)",
    options: KNOWN_ENVIRONMENTS,
    initialValues: envDefaults,
    required: false,
  });
  bail(envIds);

  const purpose = await select({
    message: "Workspace purpose / Propósito",
    options: [
      { value: "build", label: "Build / Construir software", hint: "el caso normal" },
      { value: "learn", label: "Learn / Aprender", hint: "modo tutor: ejercicios y explicaciones" },
    ],
    initialValue: "build",
  });
  bail(purpose);

  const sddEnabled = await confirm({
    message: "Include Spec-Driven Development (SDD)?",
    initialValue: true,
  });
  bail(sddEnabled);

  let sddBackend: "openspec" | "hybrid" | "none" = "openspec";
  if (sddEnabled) {
    const backend = await select({
      message: "SDD backend",
      options: [
        { value: "openspec", label: "openspec (files in repo)", hint: "recommended — portable, git-versioned" },
        { value: "hybrid", label: "hybrid (openspec + engram)", hint: "adds cross-session memory if available" },
        { value: "none", label: "none", hint: "inline only, not persisted" },
      ],
      initialValue: "openspec",
    });
    bail(backend);
    sddBackend = backend as typeof sddBackend;
  }

  const livingDocs = await confirm({
    message: "Add autonomous living docs (/doc-sync + project state)?",
    initialValue: true,
  });
  bail(livingDocs);

  const useContext7 = await confirm({
    message: "Configure context7 MCP (up-to-date library docs)?",
    initialValue: true,
  });
  bail(useContext7);

  // Map detected versions when available.
  const versionOf = (id: string, list: { id: string; version: string }[]) =>
    list.find((x) => x.id === id)?.version ?? "latest";

  const config: Config = normalizeConfig({
    version: 1,
    project: {
      name: String(name).trim(),
      description: String(description).trim(),
      mode: projectMode as "new" | "existing",
      purpose: purpose as "build" | "learn",
    },
    targets: targets as ("claude" | "copilot")[],
    language: language as "es" | "en",
    stack: {
      languages: (langIds as string[]).map((id) => ({ id, version: versionOf(id, detected.languages) })),
      frameworks: (fwIds as string[]).map((id) => ({ id, version: versionOf(id, detected.frameworks) })),
      environments: (envIds as string[]).map((id) => ({ id, version: versionOf(id, detected.environments) })),
      runtime: detected.runtime,
    },
    sdd: { enabled: Boolean(sddEnabled), backend: sddBackend, vendorSkills: true },
    livingDocs: Boolean(livingDocs),
    mcp: useContext7 ? ["context7"] : [],
    ingest: { sources: options.from ?? [], reconcileWithContext7: true, preferCompanyOnConflict: true },
    templatesVersion: TEMPLATES_VERSION,
  });

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
