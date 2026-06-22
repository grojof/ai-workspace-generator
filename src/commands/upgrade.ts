import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import pc from "picocolors";
import { loadConfig, saveConfig } from "../config/loader.js";
import { generate } from "../generate/index.js";
import { setDryRun, getPlanned } from "../render/writer.js";
import { lineDiff } from "../render/diff.js";
import { printArtifacts } from "../util/report.js";
import { migrateBlockIds, pruneRenamedOrphans } from "./migrate.js";
import { TEMPLATES_VERSION } from "../version.js";

interface UpgradeOptions {
  check?: boolean;
}

function rel(cwd: string, abs: string): string {
  return relative(cwd, abs).split("\\").join("/");
}

/**
 * Re-render with the current template set, showing a diff first. `--check` only
 * previews (no writes); without it, applies and bumps templatesVersion.
 */
export function runUpgrade(cwd: string, options: UpgradeOptions = {}): void {
  const config = loadConfig(cwd);
  const from = config.templatesVersion;

  console.log(pc.bold(`\nUpgrade — templates ${pc.cyan(from)} → ${pc.cyan(TEMPLATES_VERSION)}\n`));

  // One-shot namespace migration (ADR 0003 F1b): rewrite legacy bare spine markers to `aiws:*` BEFORE
  // rendering, so generate updates the existing regions in place instead of appending duplicates next to
  // orphans. Idempotent — already-namespaced repos see no changes. Preview mode leaves files untouched.
  if (!options.check) {
    const migrated = migrateBlockIds(cwd, config);
    if (migrated.length) {
      console.log(pc.dim("  Namespaced legacy managed blocks:"));
      for (const m of migrated)
        console.log(pc.dim(`    ${m.file} (${m.count} marker${m.count === 1 ? "" : "s"})`));
      console.log();
    }
  }

  // Dry run to compute what would change.
  setDryRun(true);
  generate(cwd, config);
  const planned = new Map(getPlanned());
  setDryRun(false);

  const changes = [...planned.entries()].filter(([abs, content]) => {
    const before = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    return before !== content;
  });

  if (changes.length === 0 && from === TEMPLATES_VERSION) {
    console.log(pc.green("Already up to date. Nothing to change.\n"));
    return;
  }

  for (const [abs, content] of changes) {
    const before = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    console.log(pc.bold(pc.underline(rel(cwd, abs))));
    console.log(lineDiff(before, content));
    console.log();
  }
  console.log(pc.dim(`  ${changes.length} file(s) would change.\n`));

  if (options.check) {
    console.log(pc.yellow("Preview only (--check). Re-run `ai-workspace upgrade` to apply.\n"));
    return;
  }

  // Apply for real.
  const { artifacts } = generate(cwd, config);
  printArtifacts(artifacts);

  // Prune skill folders / command + prompt files orphaned by the `aiws-` rename (F1a), guarded by the
  // freshly-written artifact set so nothing the generator still emits is ever removed.
  const removed = pruneRenamedOrphans(
    cwd,
    artifacts.map((a) => a.path),
  );
  if (removed.length) {
    console.log(pc.dim(`\n  Removed ${removed.length} renamed orphan(s):`));
    for (const r of removed) console.log(pc.dim(`    ${r}`));
  }

  config.templatesVersion = TEMPLATES_VERSION;
  saveConfig(cwd, config);
  console.log(pc.green(`\n✔ Upgraded to templates ${TEMPLATES_VERSION}.\n`));
}
