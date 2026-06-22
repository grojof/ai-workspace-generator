import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import { loadConfig, saveConfig } from "../config/loader.js";
import { generate } from "../generate/index.js";
import { printArtifacts } from "../util/report.js";
import { removeBlock } from "../render/managed-region.js";
import { aiwsBlockId } from "../generate/naming.js";
import type { ModuleType } from "../modules/registry.js";

const TYPES: ModuleType[] = ["language", "framework", "environment", "mcp"];

/** Strip a now-orphaned managed block from a generated file, if present. */
function stripBlock(cwd: string, file: string, id: string): void {
  const path = resolve(cwd, file);
  if (!existsSync(path)) return;
  const before = readFileSync(path, "utf8");
  const after = removeBlock(before, "html", id);
  if (after !== before) writeFileSync(path, after, "utf8");
}

/** Remove a language/framework/mcp from the config, strip its block, and re-render. */
export function runRemove(cwd: string, typeArg: string, id: string): void {
  const type = typeArg as ModuleType;
  if (!TYPES.includes(type)) {
    throw new Error(`Unknown module type "${typeArg}". Use one of: ${TYPES.join(", ")}.`);
  }
  const config = loadConfig(cwd);

  if (type === "language") {
    config.stack.languages = config.stack.languages.filter((l) => l.id !== id);
    stripBlock(cwd, "AGENTS.md", aiwsBlockId(`lang-${id}`));
    stripBlock(cwd, ".github/copilot-instructions.md", aiwsBlockId(`lang-${id}`));
  } else if (type === "framework") {
    config.stack.frameworks = config.stack.frameworks.filter((f) => f.id !== id);
    stripBlock(cwd, "AGENTS.md", aiwsBlockId(`fw-${id}`));
    stripBlock(cwd, ".github/copilot-instructions.md", aiwsBlockId(`fw-${id}`));
  } else if (type === "environment") {
    config.stack.environments = config.stack.environments.filter((e) => e.id !== id);
    stripBlock(cwd, "AGENTS.md", aiwsBlockId(`env-${id}`));
    stripBlock(cwd, ".github/copilot-instructions.md", aiwsBlockId(`env-${id}`));
  } else {
    config.mcp = config.mcp.filter((m) => m !== id);
  }

  saveConfig(cwd, config);
  console.log(pc.bold(`\nRemoved ${type} ${pc.cyan(id)} — re-rendering…\n`));
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);
  console.log(pc.green("\n✔ Updated.\n"));
}
