import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeManaged, type WriteResult } from "../render/writer.js";
import { strings } from "../i18n/strings.js";

function ignoreBody(header: string, patterns: string[]): string {
  return [`# ${header}`, ...patterns].join("\n");
}

/**
 * Generate AI-context ignore files (token savings) and a managed .gitignore block.
 * All use hash-style managed regions so manual entries outside the markers survive.
 */
export function generateScope(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const header = strings(config.language).scopeHeader;
  const block = ignoreBody(header, config.scope.ignore);

  if (config.targets.includes("claude")) {
    results.push(
      writeManaged(resolve(cwd, ".claudeignore"), "hash", [{ id: "ignore", content: block }]),
    );
  }
  if (config.targets.includes("copilot")) {
    results.push(
      writeManaged(resolve(cwd, ".copilotignore"), "hash", [{ id: "ignore", content: block }]),
    );
  }

  const gitignoreBlock = [`# ${header}`, ...config.scope.gitignoreManaged].join("\n");
  results.push(
    writeManaged(resolve(cwd, ".gitignore"), "hash", [{ id: "ai-workspace", content: gitignoreBlock }]),
  );

  return results;
}
