import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { renderTemplate, setLocale } from "../render/engine.js";
import { writeFile, writeIfMissing, writeManaged, type WriteResult } from "../render/writer.js";
import { composeBlocks } from "./agents.js";
import { buildClaudeMcp, buildVscodeMcp } from "./mcp.js";
import { generateScope } from "./scope.js";
import { generateSdd } from "./sdd.js";
import { generateSkills } from "./skills.js";
import { generateLivingDocs } from "./livingDocs.js";
import { generateGuides, generateVscode } from "./guides.js";
import { generateGovernance } from "./governance.js";
import { generateLearning } from "./learning.js";
import { strings } from "../i18n/strings.js";

export interface Artifact {
  path: string; // relative to cwd
  desc: string;
  status: WriteResult["status"];
}

function copilotHeader(es: boolean): string {
  return es
    ? `# GitHub Copilot — instrucciones del repositorio

> Espejo generado de **AGENTS.md** (fuente única de verdad). No lo edites a mano — edita \`AGENTS.md\`
> y ejecuta \`ai-workspace sync\`. El contenido fuera de los marcadores se preserva.`
    : `# GitHub Copilot — repository instructions

> Generated mirror of **AGENTS.md** (single source of truth). Do not edit by hand — edit \`AGENTS.md\`
> and run \`ai-workspace sync\`. Content outside the markers is preserved.`;
}

function rel(cwd: string, abs: string): string {
  return relative(cwd, abs).split("\\").join("/");
}

export interface GenerateResult {
  artifacts: Artifact[];
}

/** Render every artifact from config. Idempotent: safe to re-run (managed regions preserved). */
export function generate(cwd: string, config: Config): GenerateResult {
  setLocale(config.language);
  const t = strings(config.language);
  const es = config.language === "es";
  const artifacts: Artifact[] = [];
  const add = (r: WriteResult, desc: string) =>
    artifacts.push({ path: rel(cwd, r.path), desc, status: r.status });

  const blocks = composeBlocks(config);

  // 1. AGENTS.md — single source of truth, composed managed blocks.
  add(writeManaged(resolve(cwd, "AGENTS.md"), "html", blocks), t.desc.agents);

  // 2. Claude adapter.
  if (config.targets.includes("claude")) {
    add(
      writeManaged(resolve(cwd, "CLAUDE.md"), "html", [
        { id: "claude", content: renderTemplate("targets/claude/CLAUDE.md.eta", { ...config }) },
      ]),
      t.desc.claudeAdapter,
    );
    add(writeFile(resolve(cwd, ".mcp.json"), buildClaudeMcp(config.mcp)), t.desc.claudeMcp);
    add(generateClaudeSettings(cwd, config), t.desc.claudeSettings);
  }

  // 3. Copilot adapter — mirror of AGENTS.md body.
  if (config.targets.includes("copilot")) {
    const copilotBlocks = [
      { id: "copilot-header", content: copilotHeader(es) },
      ...blocks.filter((b) => b.id !== "header"),
    ];
    add(writeManaged(resolve(cwd, ".github/copilot-instructions.md"), "html", copilotBlocks), t.desc.copilot);
    add(buildVscodeMcpFile(cwd, config), t.desc.vscodeMcp);

    // Path-scoped instruction for TypeScript, when present.
    if (config.stack.languages.some((l) => l.id === "typescript")) {
      const tsInstr = es
        ? [
            "---",
            'applyTo: "**/*.ts,**/*.tsx"',
            "---",
            "",
            "Aplica las reglas de TypeScript de AGENTS.md (Capa 1). Modo estricto, sin any implícito,",
            "exports nombrados, valida datos externos con un schema en el límite.",
          ].join("\n")
        : [
            "---",
            'applyTo: "**/*.ts,**/*.tsx"',
            "---",
            "",
            "Apply the TypeScript rules from AGENTS.md (Layer 1). Strict mode, no implicit any,",
            "named exports, validate external data with a schema at the boundary.",
          ].join("\n");
      add(writeFile(resolve(cwd, ".github/instructions/typescript.instructions.md"), tsInstr), t.desc.tsInstructions);
    }
  }

  // 4. Shared format/encoding files.
  add(writeIfMissing(resolve(cwd, ".editorconfig"), renderTemplate("shared/editorconfig.eta", { ...config })), t.desc.editorconfig);
  add(
    writeManaged(resolve(cwd, ".gitattributes"), "hash", [
      { id: "ai-workspace", content: "* text=auto eol=lf\n*.{png,jpg,jpeg,gif,ico,pdf,zip,woff,woff2} binary" },
    ]),
    t.desc.gitattributes,
  );

  // 5. Scope / ignore.
  for (const r of generateScope(cwd, config)) add(r, t.desc.ignore);

  // 6. SDD module + vendored skills.
  for (const r of generateSdd(cwd, config)) add(r, t.desc.sdd);
  for (const r of generateSkills(cwd, config)) add(r, t.desc.skill);

  // 7. Living docs.
  for (const r of generateLivingDocs(cwd, config)) add(r, t.desc.livingDocs);

  // 7b. Governance: version/security/commit policy enforcement.
  const govDesc = es ? "Gobernanza: versiones, seguridad, commits." : "Governance: versions, security, commits.";
  for (const r of generateGovernance(cwd, config)) add(r, govDesc);

  // 8. Learner guides + VS Code setup + learning mode (tutor).
  for (const r of generateGuides(cwd, config)) add(r, t.desc.skill);
  for (const r of generateVscode(cwd, config)) add(r, t.desc.vscodeExtensions);
  for (const r of generateLearning(cwd, config)) add(r, t.desc.skill);

  // 9. Onboarding — rendered last so it can list everything.
  const onboarding = renderTemplate("shared/ai-workspace.md.eta", { ...config, artifacts });
  add(writeFile(resolve(cwd, "AI-WORKSPACE.md"), onboarding), t.desc.onboarding);

  return { artifacts };
}

function buildVscodeMcpFile(cwd: string, config: Config): WriteResult {
  return writeFile(resolve(cwd, ".vscode/mcp.json"), buildVscodeMcp(config.mcp));
}

/** Write .claude/settings.json, merging an optional /doc-sync Stop hook into any existing file. */
function generateClaudeSettings(cwd: string, config: Config): WriteResult {
  const path = resolve(cwd, ".claude/settings.json");
  const hookCmd = `echo "${strings(config.language).docSyncReminder}"`;
  let settings: any = { permissions: { allow: [], deny: [] } };
  if (existsSync(path)) {
    try {
      settings = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      /* keep default on parse error */
    }
  }
  settings.permissions ??= { allow: [], deny: [] };

  if (config.livingDocsHook) {
    settings.hooks ??= {};
    settings.hooks.Stop = [{ hooks: [{ type: "command", command: hookCmd }] }];
  } else if (settings.hooks?.Stop) {
    // Remove our managed hook if disabled (best-effort: only when it's exactly ours).
    const stop = settings.hooks.Stop;
    if (Array.isArray(stop) && JSON.stringify(stop).includes("/doc-sync")) {
      delete settings.hooks.Stop;
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    }
  }

  return writeFile(path, JSON.stringify(settings, null, 2));
}
