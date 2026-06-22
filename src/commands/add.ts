import pc from "picocolors";
import { loadConfig, saveConfig } from "../config/loader.js";
import { generate } from "../generate/index.js";
import { printArtifacts } from "../util/report.js";
import { find, type ModuleType } from "../modules/registry.js";

const TYPES: ModuleType[] = ["language", "framework", "environment", "mcp"];

/** Add a language/framework/mcp module to the config and re-render. */
export function runAdd(cwd: string, typeArg: string, id: string, version = "latest"): void {
  const type = typeArg as ModuleType;
  if (!TYPES.includes(type)) {
    throw new Error(`Unknown module type "${typeArg}". Use one of: ${TYPES.join(", ")}.`);
  }
  const entry = find(type, id);
  if (!entry) {
    throw new Error(
      `Unknown ${type} "${id}". Run \`ai-workspace add ${type}\` choices are limited to the registry.`,
    );
  }

  const config = loadConfig(cwd);

  if (type === "language") {
    if (config.stack.languages.some((l) => l.id === id)) {
      console.log(pc.yellow(`Language "${id}" already present.`));
    } else {
      config.stack.languages.push({ id, version });
    }
  } else if (type === "framework") {
    if (config.stack.frameworks.some((f) => f.id === id)) {
      console.log(pc.yellow(`Framework "${id}" already present.`));
    } else {
      config.stack.frameworks.push({ id, version });
    }
  } else if (type === "environment") {
    if (config.stack.environments.some((e) => e.id === id)) {
      console.log(pc.yellow(`Environment "${id}" already present.`));
    } else {
      config.stack.environments.push({ id, version });
    }
  } else {
    if (config.mcp.includes(id)) {
      console.log(pc.yellow(`MCP "${id}" already present.`));
    } else {
      config.mcp.push(id);
    }
  }

  saveConfig(cwd, config);
  console.log(pc.bold(`\nAdded ${type} ${pc.cyan(id)} — re-rendering…\n`));
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);
  console.log(pc.green("\n✔ Updated. Edit AGENTS.md / workspace.config.yaml for details.\n"));
}
