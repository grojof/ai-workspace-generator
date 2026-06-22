import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";
import { ConfigSchema, type Config } from "./schema.js";

export const CONFIG_FILENAME = "workspace.config.yaml";

export function configPath(cwd: string): string {
  return resolve(cwd, CONFIG_FILENAME);
}

export function configExists(cwd: string): boolean {
  return existsSync(configPath(cwd));
}

/** Load and validate the config. Throws a readable error on invalid shape. */
export function loadConfig(cwd: string): Config {
  const path = configPath(cwd);
  if (!existsSync(path)) {
    throw new Error(`No ${CONFIG_FILENAME} found in ${cwd}. Run \`ai-workspace init\` first.`);
  }
  const raw = parse(readFileSync(path, "utf8")) ?? {};
  const parsed = ConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${CONFIG_FILENAME}:\n${issues}`);
  }
  return parsed.data;
}

/** Normalize partial input through the schema (applies defaults). */
export function normalizeConfig(input: unknown): Config {
  return ConfigSchema.parse(input);
}

const CONFIG_HEADER = `# AI Workspace configuration — single source of inputs for the generator.
# Edit this file and re-run \`ai-workspace sync\` to regenerate artifacts idempotently.
# Docs: see AI-WORKSPACE.md
`;

export function saveConfig(cwd: string, config: Config): void {
  const body = stringify(config, { indent: 2, lineWidth: 100 });
  writeFileSync(configPath(cwd), `${CONFIG_HEADER}\n${body}`, "utf8");
}
