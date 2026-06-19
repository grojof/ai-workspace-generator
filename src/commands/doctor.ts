import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { estimateTokens } from "../util/tokens.js";
import { composeBlocks } from "../generate/agents.js";
import { setLocale } from "../render/engine.js";
import { MCPS } from "../modules/registry.js";

interface Finding {
  level: "ok" | "warn" | "error";
  message: string;
}

/** Block ids that legitimately exist in AGENTS.md but aren't produced by composeBlocks. */
const EXTRA_KNOWN_BLOCKS = new Set(["imported"]);

/** Lint the generated workspace: token budgets, key artifacts, consistency. */
export function runDoctor(cwd: string): void {
  const config = loadConfig(cwd);
  setLocale(config.language);
  const findings: Finding[] = [];

  // --- AGENTS.md presence + token budget + orphaned blocks ---
  const agentsPath = resolve(cwd, "AGENTS.md");
  if (!existsSync(agentsPath)) {
    findings.push({ level: "error", message: "AGENTS.md missing — run `ai-workspace sync`." });
  } else {
    const agents = readFileSync(agentsPath, "utf8");
    const tokens = estimateTokens(agents);
    const budget = config.tokenBudget.agentsMd;
    findings.push({
      level: tokens > budget ? "warn" : "ok",
      message: `AGENTS.md ≈ ${tokens} tokens (budget ${budget}).`,
    });

    const expected = new Set(composeBlocks(config).map((b) => b.id));
    const present = [...agents.matchAll(/ai-workspace:begin:([\w-]+)/g)].map((m) => m[1]);
    const orphaned = present.filter((id) => !expected.has(id) && !EXTRA_KNOWN_BLOCKS.has(id));
    if (orphaned.length) {
      findings.push({
        level: "warn",
        message: `Orphaned managed blocks in AGENTS.md: ${[...new Set(orphaned)].join(", ")} (no longer generated — remove by hand).`,
      });
    } else {
      findings.push({ level: "ok", message: "No orphaned managed blocks." });
    }
  }

  // --- Target adapter files present ---
  if (config.targets.includes("claude") && !existsSync(resolve(cwd, "CLAUDE.md"))) {
    findings.push({ level: "warn", message: "CLAUDE.md missing for target 'claude'." });
  }
  if (config.targets.includes("copilot") && !existsSync(resolve(cwd, ".github/copilot-instructions.md"))) {
    findings.push({ level: "warn", message: "copilot-instructions.md missing for target 'copilot'." });
  }

  // --- MCP entries are known to the registry ---
  const known = new Set(MCPS.map((m) => m.id));
  const unknownMcp = config.mcp.filter((id) => !known.has(id));
  if (unknownMcp.length) {
    findings.push({
      level: "warn",
      message: `Unknown MCP server(s): ${unknownMcp.join(", ")} (not in registry; no config emitted).`,
    });
  }

  // --- SDD backend coherence ---
  if (config.sdd.backend === "hybrid") {
    findings.push({
      level: "warn",
      message: "SDD backend 'hybrid' relies on engram if installed; the in-repo spec store remains canonical.",
    });
  }

  // --- Commit hook present but maybe not activated ---
  if (config.workflow.commits.gitHook && existsSync(resolve(cwd, ".githooks/commit-msg"))) {
    findings.push({
      level: "ok",
      message: "commit-msg hook present. Activate once with `git config core.hooksPath .githooks`.",
    });
  }

  // --- Report ---
  console.log(pc.bold(`\nDoctor — ${config.project.name}\n`));
  for (const f of findings) {
    const tag =
      f.level === "ok" ? pc.green("ok  ") : f.level === "warn" ? pc.yellow("warn") : pc.red("err ");
    console.log(`  ${tag} ${f.message}`);
  }
  const errors = findings.filter((f) => f.level === "error").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  console.log(pc.dim(`\n  ${errors} errors, ${warns} warnings\n`));
  if (errors > 0) process.exitCode = 1;
}
