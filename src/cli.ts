#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";
import { runDoctor } from "./commands/doctor.js";
import { runAdd } from "./commands/add.js";
import { runRemove } from "./commands/remove.js";
import { runList } from "./commands/list.js";
import { runImport } from "./commands/import.js";
import { runUpgrade } from "./commands/upgrade.js";
import { runPackage } from "./commands/package.js";
import { runSkillsSync } from "./commands/skillsSync.js";

const program = new Command();

program
  .name("ai-workspace")
  .description("Generate and adapt an AI workspace (Claude Code + GitHub Copilot) for any project.")
  .version("0.1.0");

program
  .command("init")
  .description("Interactive wizard: detect stack, write workspace.config.yaml, render artifacts.")
  .option("--from <paths...>", "existing company assets to ingest (recorded for `import`)")
  .option("-y, --yes", "accept defaults where possible")
  .action(async (opts) => {
    try {
      await runInit(process.cwd(), opts);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("sync")
  .description("Re-render all artifacts from workspace.config.yaml (idempotent).")
  .action(() => {
    try {
      runSync(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Lint the workspace: token budgets and key artifacts.")
  .action(() => {
    try {
      runDoctor(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("add")
  .description("Add a module (language|framework|mcp) to the config and re-render.")
  .argument("<type>", "module type: language | framework | mcp")
  .argument("<id>", "module id, e.g. go, nextjs, context7")
  .option("--module-version <version>", "version to pin", "latest")
  .action((type, id, opts) => {
    try {
      runAdd(process.cwd(), type, id, opts.moduleVersion);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("remove")
  .description("Remove a module (language|framework|mcp) from the config and re-render.")
  .argument("<type>", "module type: language | framework | mcp")
  .argument("<id>", "module id, e.g. go, nextjs, context7")
  .action((type, id) => {
    try {
      runRemove(process.cwd(), type, id);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("list")
  .description("Show current config and the module catalog (enabled vs available).")
  .action(() => {
    try {
      runList(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("import")
  .description("Ingest existing company assets and prepare a context7 reconciliation checklist.")
  .argument("<paths...>", "source folders to ingest")
  .action((paths) => {
    try {
      runImport(process.cwd(), paths);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("upgrade")
  .description("Re-render with the latest templates, showing a diff first.")
  .option("--check", "preview changes without writing")
  .action((opts) => {
    try {
      runUpgrade(process.cwd(), opts);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("package")
  .description("Package the workspace as a Claude Code plugin + private marketplace, and stage org-skill zips for claude.ai.")
  .action(() => {
    try {
      runPackage(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

const skills = program.command("skills").description("Maintain the vendored skill-packs library.");
skills
  .command("sync")
  .description("Pull the upstream skill source (agent-skills) at a pinned ref; diff vs vendored base. Dry-run unless --apply.")
  .option("--ref <ref>", "target tag/sha (with --source; default: latest upstream tag)")
  .option("--source <name>", "limit to one vendored source (e.g. agent-skills, microsoft-skills)")
  .option("--apply", "apply: update vendor/ + skill-packs/ and re-seal the pin")
  .action((opts) => {
    try {
      runSkillsSync({ ref: opts.ref, apply: opts.apply, source: opts.source });
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
