import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { generate } from "../generate/index.js";
import { setDryRun, getPlanned } from "../render/writer.js";
import { lineDiff } from "../render/diff.js";
import { printArtifacts } from "../util/report.js";

interface SyncOptions {
  check?: boolean;
}

function rel(cwd: string, abs: string): string {
  return relative(cwd, abs).split("\\").join("/");
}

/**
 * Re-render all artifacts from workspace.config.yaml. Idempotent. `--check` previews what `sync` would
 * restore (self-healing without overwriting), so out-of-band drift is visible before any write.
 */
export function runSync(cwd: string, options: SyncOptions = {}): void {
  const config = loadConfig(cwd);

  if (options.check) {
    console.log(pc.bold(`\nSync preview for ${pc.cyan(config.project.name)} (no writes)…\n`));
    setDryRun(true);
    generate(cwd, config);
    const planned = [...getPlanned()];
    setDryRun(false);
    const changes = planned.filter(
      ([abs, content]) => (existsSync(abs) ? readFileSync(abs, "utf8") : "") !== content,
    );
    if (changes.length === 0) {
      console.log(pc.green("  ✔ Everything matches. Nothing to restore.\n"));
      return;
    }
    for (const [abs, content] of changes) {
      const before = existsSync(abs) ? readFileSync(abs, "utf8") : "";
      console.log(pc.bold(pc.underline(rel(cwd, abs))));
      console.log(lineDiff(before, content));
      console.log();
    }
    console.log(
      pc.yellow(`  ${changes.length} file(s) would be restored. Run \`ai-workspace sync\` to apply.\n`),
    );
    return;
  }

  console.log(pc.bold(`\nSyncing AI workspace for ${pc.cyan(config.project.name)}…\n`));
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);
  console.log(pc.green("\n✔ Workspace synced. See AI-WORKSPACE.md for an index.\n"));
}
