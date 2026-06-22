import pc from "picocolors";
import { loadConfig, configExists } from "../config/loader.js";
import { LANGUAGES, FRAMEWORKS, ENVIRONMENTS, MCPS } from "../modules/registry.js";

/** Show the current configuration and the module catalog (enabled vs available). */
export function runList(cwd: string): void {
  const config = configExists(cwd) ? loadConfig(cwd) : null;

  if (config) {
    console.log(
      pc.bold(`\n${config.project.name}`) +
        pc.dim(`  (${config.project.mode}, ${config.language}, targets: ${config.targets.join("+")})`),
    );
  } else {
    console.log(
      pc.dim("\nNo workspace.config.yaml yet — showing the available catalog. Run `ai-workspace init`."),
    );
  }

  const enabledLang = new Set(config?.stack.languages.map((l) => l.id));
  const enabledFw = new Set(config?.stack.frameworks.map((f) => f.id));
  const enabledEnv = new Set(config?.stack.environments.map((e) => e.id));
  const enabledMcp = new Set(config?.mcp);

  const row = (on: boolean, label: string, bundled?: boolean) =>
    `  ${on ? pc.green("●") : pc.dim("○")} ${on ? label : pc.dim(label)}${bundled ? pc.dim(" · bundled") : ""}`;

  console.log(pc.bold("\nLanguages"));
  for (const m of LANGUAGES) console.log(row(enabledLang.has(m.id), m.label, m.bundled));
  console.log(pc.bold("\nFrameworks"));
  for (const m of FRAMEWORKS) console.log(row(enabledFw.has(m.id), m.label, m.bundled));
  console.log(pc.bold("\nEnvironments"));
  for (const m of ENVIRONMENTS) console.log(row(enabledEnv.has(m.id), m.label, m.bundled));
  console.log(pc.bold("\nMCP servers"));
  for (const m of MCPS) console.log(row(enabledMcp.has(m.id), m.label, m.bundled));

  console.log(pc.dim("\n  ● enabled   ○ available — add with `ai-workspace add <type> <id>`\n"));
}
