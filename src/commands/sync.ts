import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { generate } from "../generate/index.js";
import { printArtifacts } from "../util/report.js";

/** Re-render all artifacts from workspace.config.yaml. Idempotent. */
export function runSync(cwd: string): void {
  const config = loadConfig(cwd);
  console.log(pc.bold(`\nSyncing AI workspace for ${pc.cyan(config.project.name)}…\n`));
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);
  console.log(pc.green("\n✔ Workspace synced. See AI-WORKSPACE.md for an index.\n"));
}
