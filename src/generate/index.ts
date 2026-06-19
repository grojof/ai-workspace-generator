import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { resolveRepos, unionStack, type Config, type ResolvedRepo } from "../config/schema.js";
import { renderTemplate, setLocale } from "../render/engine.js";
import { writeFile, writeIfMissing, writeManaged, type WriteResult } from "../render/writer.js";
import { composeBlocks } from "./agents.js";
import { buildClaudeMcp, buildVscodeMcp } from "./mcp.js";
import { generateScope } from "./scope.js";
import { generateSdd } from "./sdd.js";
import { generateSkills } from "./skills.js";
import { generateStackPacks } from "./stackPacks.js";
import { generateLivingDocs } from "./livingDocs.js";
import { generateGuides, generateVscode } from "./guides.js";
import { generateGovernance } from "./governance.js";
import { generateLearning } from "./learning.js";
import { generateDocsIndex } from "./docsIndex.js";
import { docsPaths } from "./paths.js";
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

/**
 * The `@`-import path a repo's `CLAUDE.md` uses to reach the root `AGENTS.md`. The root (`"."`) imports it
 * directly; a child at `a/` imports `../AGENTS.md`, `x/y/` → `../../AGENTS.md`. POSIX separators (Claude Code
 * resolves imports relative to the importing file).
 */
export function agentsImportPath(repoPath: string): string {
  const norm = repoPath.replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\/+$/, "");
  if (!norm || norm === ".") return "AGENTS.md";
  const depth = norm.split("/").length;
  return `${"../".repeat(depth)}AGENTS.md`;
}

/** kebab-case slug for a repo path, used as the Copilot per-repo instruction filename. */
function repoSlug(repoPath: string): string {
  return repoPath.replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\/+$/, "").replace(/[^\w.-]+/g, "-").toLowerCase() || "repo";
}

/** A Copilot path-scoped instruction (`applyTo` glob) for one child repo — Copilot's native per-path hook. */
function repoInstruction(repo: ResolvedRepo, es: boolean): string {
  const stack = [
    ...repo.stack.languages.map((l) => l.id),
    ...repo.stack.frameworks.map((f) => f.id),
    ...repo.stack.environments.map((e) => e.id),
  ].join(", ") || (es ? "(sin stack específico)" : "(no specific stack)");
  const body = es
    ? [
        `Estás trabajando en el repo **${repo.name}** (\`${repo.path}/\`) de este workspace multi-repo.`,
        `Stack: ${stack}. Aplica las capas correspondientes de \`AGENTS.md\` (Capa 1+). Las skills`,
        `específicas de su stack viven en \`${repo.path}/.claude/skills\`.`,
      ].join("\n")
    : [
        `You are working in the **${repo.name}** repo (\`${repo.path}/\`) of this multi-repo workspace.`,
        `Stack: ${stack}. Apply the matching \`AGENTS.md\` layers (Layer 1+). Stack-specific skills live`,
        `under \`${repo.path}/.claude/skills\`.`,
      ].join("\n");
  return ["---", `applyTo: "${repo.path}/**"`, "---", "", body, ""].join("\n");
}

/** Render every artifact from config. Idempotent: safe to re-run (managed regions preserved). */
export function generate(cwd: string, config: Config): GenerateResult {
  setLocale(config.language);
  const t = strings(config.language);
  const artifacts: Artifact[] = [];
  const add = (r: WriteResult, desc: string) =>
    artifacts.push({ path: rel(cwd, r.path), desc, status: r.status });

  // Workspace-level: the canonical set written once at the root, composed over the union of every repo's
  // stack (so AGENTS.md / Copilot / routing document the whole workspace).
  generateWorkspace(cwd, config, add);

  // Repo-level: per resolved repo, the per-repo Claude adapter (child repos only — the root already has its
  // CLAUDE.md bridge from the workspace phase) plus the stack-bound skill packs for that repo's stack.
  // Empty repos[] yields a single "." repo → packs land at the root, matching single-repo output.
  for (const repo of resolveRepos(config)) {
    const repoConfig: Config = { ...config, stack: repo.stack };
    const repoDir = resolve(cwd, repo.path);
    if (repo.path !== "." && config.targets.includes("claude")) {
      add(
        writeManaged(resolve(repoDir, "CLAUDE.md"), "html", [
          { id: "claude", content: renderTemplate("targets/claude/CLAUDE.md.eta", { ...repoConfig, agentsImport: agentsImportPath(repo.path) }) },
        ]),
        t.desc.claudeAdapter,
      );
    }
    for (const r of generateStackPacks(repoDir, repoConfig, "repo")) add(r, t.desc.skill);
  }

  // Onboarding — rendered last so it can list every artifact across all repos.
  const onboarding = renderTemplate("shared/ai-workspace.md.eta", { ...config, paths: docsPaths(config), artifacts });
  add(writeFile(resolve(cwd, "AI-WORKSPACE.md"), onboarding), t.desc.onboarding);

  return { artifacts };
}

/**
 * Workspace-level artifacts: the canonical, shared set written once at the workspace root. Composed over the
 * union of all repos' stacks so the root `AGENTS.md` (and its Copilot mirror + skill routing) covers every
 * stack present anywhere in the workspace. For a single repo the union equals the root stack, so output is
 * byte-identical to before this split.
 */
function generateWorkspace(cwd: string, config: Config, add: (r: WriteResult, desc: string) => void): void {
  const t = strings(config.language);
  const es = config.language === "es";
  const wsConfig = unionStack(config);
  const blocks = composeBlocks(wsConfig);

  // 1. AGENTS.md — single source of truth, composed managed blocks (union stack).
  add(writeManaged(resolve(cwd, "AGENTS.md"), "html", blocks), t.desc.agents);

  // 2. Claude adapter (root). Claude Code reads CLAUDE.md, not AGENTS.md, so the root gets a CLAUDE.md that
  //    imports @AGENTS.md (a bridge — no stack skills here; child repos get their own in the repo phase).
  if (config.targets.includes("claude")) {
    add(
      writeManaged(resolve(cwd, "CLAUDE.md"), "html", [
        { id: "claude", content: renderTemplate("targets/claude/CLAUDE.md.eta", { ...config }) },
      ]),
      t.desc.claudeAdapter,
    );
    add(writeFile(resolve(cwd, ".mcp.json"), buildClaudeMcp(config.mcp)), t.desc.claudeMcp);
    add(generateClaudeSettings(cwd, config), t.desc.claudeSettings);
    for (const r of generateSafetyHook(cwd, config)) add(r, t.desc.claudeSettings);
  }

  // 3. Copilot adapter — mirror of AGENTS.md body (union stack). Copilot reads a single workspace-root file
  //    (no nested discovery), so it stays workspace-level and covers every repo's stack.
  if (config.targets.includes("copilot")) {
    const copilotBlocks = [
      { id: "copilot-header", content: copilotHeader(es) },
      ...blocks.filter((b) => b.id !== "header"),
    ];
    add(writeManaged(resolve(cwd, ".github/copilot-instructions.md"), "html", copilotBlocks), t.desc.copilot);
    add(buildVscodeMcpFile(cwd, config), t.desc.vscodeMcp);

    // Path-scoped instruction for TypeScript, when present in any repo's stack.
    if (wsConfig.stack.languages.some((l) => l.id === "typescript")) {
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

    // Per-repo Copilot guidance: Copilot has no nested discovery, so each child repo gets a path-scoped
    // `applyTo` instruction at the workspace root. Single-repo (empty repos[]) emits none.
    for (const repo of resolveRepos(config)) {
      if (repo.path === ".") continue;
      add(
        writeFile(resolve(cwd, ".github/instructions", `${repoSlug(repo.path)}.instructions.md`), repoInstruction(repo, es)),
        t.desc.tsInstructions,
      );
    }
  }

  // 4. Shared format/encoding files.
  add(writeIfMissing(resolve(cwd, ".editorconfig"), renderTemplate("shared/editorconfig.eta", { ...config })), t.desc.editorconfig);
  add(
    writeManaged(resolve(cwd, ".gitattributes"), "hash", [
      {
        id: "ai-workspace",
        // One pattern per line — git's .gitattributes has no brace expansion.
        content: [
          "* text=auto eol=lf",
          ...["png", "jpg", "jpeg", "gif", "ico", "pdf", "zip", "woff", "woff2"].map((e) => `*.${e} binary`),
        ].join("\n"),
      },
    ]),
    t.desc.gitattributes,
  );

  // 5. Scope / ignore.
  for (const r of generateScope(cwd, config)) add(r, t.desc.ignore);

  // 6. SDD module + vendored workflow skills + workspace (non-stack) packs (sdd-*/corp-*).
  for (const r of generateSdd(cwd, config)) add(r, t.desc.sdd);
  for (const r of generateSkills(cwd, config)) add(r, t.desc.skill);
  for (const r of generateStackPacks(cwd, config, "workspace")) add(r, t.desc.skill);

  // 7. Living docs + docs/ structure index.
  for (const r of generateLivingDocs(cwd, config)) add(r, t.desc.livingDocs);
  const docsIndexDesc = es ? "Índice de docs/: explica la estructura de la documentación." : "docs/ index: explains the documentation layout.";
  for (const r of generateDocsIndex(cwd, config)) add(r, docsIndexDesc);

  // 7b. Governance: version/security/commit policy enforcement.
  const govDesc = es ? "Gobernanza: versiones, seguridad, commits." : "Governance: versions, security, commits.";
  for (const r of generateGovernance(cwd, config)) add(r, govDesc);

  // 8. Learner guides + VS Code setup + learning mode (tutor).
  for (const r of generateGuides(cwd, config)) add(r, t.desc.skill);
  for (const r of generateVscode(cwd, wsConfig)) add(r, t.desc.vscodeExtensions);
  for (const r of generateLearning(cwd, config)) add(r, t.desc.skill);
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

  // Safety guard: a PreToolUse Bash hook that hardens the Safety gate (opt-in). See generateSafetyHook.
  const guard = config.workflow.hooks.safetyGuard;
  if (guard !== "off") {
    settings.hooks ??= {};
    settings.hooks.PreToolUse = [
      { matcher: "Bash", hooks: [{ type: "command", command: `node .claude/hooks/safety-guard.mjs ${guard}` }] },
    ];
  } else if (settings.hooks?.PreToolUse) {
    if (JSON.stringify(settings.hooks.PreToolUse).includes("safety-guard.mjs")) {
      delete settings.hooks.PreToolUse;
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    }
  }

  return writeFile(path, JSON.stringify(settings, null, 2));
}

/** The portable Node safety-guard hook script (PreToolUse · Bash). Pure Node; fails open on any error. */
function safetyGuardScript(): string {
  return `#!/usr/bin/env node
// ai-workspace safety guard — PreToolUse (Bash). Hardens the Safety gate deterministically.
// Mode from argv[2]: "warn" => ask, anything else => deny. Fails OPEN: any error/no-match => allow.
import { readFileSync } from "node:fs";

const decision = process.argv[2] === "warn" ? "ask" : "deny";

// Risky command patterns — kept tight to limit false positives. [regex, why].
const RISKY = [
  [/git\\s+push\\s+.*(--force(?!-with-lease)|\\s-f\\b)/, "force-push rewrites remote history"],
  [/git\\s+push\\s+.*--force-with-lease/, "force-push (with lease) rewrites remote history"],
  [/\\brm\\s+-[a-z]*r[a-z]*f|\\brm\\s+-[a-z]*f[a-z]*r/, "recursive force delete is destructive"],
  [/git\\s+reset\\s+--hard/, "reset --hard discards uncommitted work"],
  [/git\\s+clean\\s+-[a-z]*f[a-z]*d|git\\s+clean\\s+-[a-z]*d[a-z]*f/, "git clean -fd deletes untracked files"],
  [/prisma\\s+migrate|alembic\\s+upgrade|db:migrate|flyway\\s+migrate|\\bmigrate:|:migrate\\b/, "a migration changes data/schema"],
  [/npm\\s+(i|install)\\s+\\S+@\\d|pip\\s+install\\s+\\S+==|npm\\s+update\\b|yarn\\s+upgrade\\b|npm\\s+i\\s+-g\\b/, "a dependency version change"],
];

function readStdin() { try { return readFileSync(0, "utf8"); } catch { return ""; } }

try {
  const data = JSON.parse(readStdin() || "{}");
  const cmd = (data.tool_input && data.tool_input.command) || "";
  for (const [re, why] of RISKY) {
    if (re.test(cmd)) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: decision,
          permissionDecisionReason: "Safety gate: " + why + ". Confirm this is intended (see AGENTS.md).",
        },
      }));
      break;
    }
  }
} catch { /* fail open */ }
process.exit(0);
`;
}

/** Write the safety-guard script when enabled (Claude target only). */
export function generateSafetyHook(cwd: string, config: Config): WriteResult[] {
  if (!config.targets.includes("claude") || config.workflow.hooks.safetyGuard === "off") return [];
  return [writeFile(resolve(cwd, ".claude/hooks/safety-guard.mjs"), safetyGuardScript())];
}
