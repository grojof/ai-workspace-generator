#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { CLI_VERSION } from "./version.js";
import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";
import { runDoctor } from "./commands/doctor.js";
import { runVerify } from "./commands/verify.js";
import { runPacksSync } from "./commands/packsSync.js";
import { runAdd } from "./commands/add.js";
import { runRemove } from "./commands/remove.js";
import { runList } from "./commands/list.js";
import { runImport } from "./commands/import.js";
import { runDetect } from "./commands/detect.js";
import { runUpgrade } from "./commands/upgrade.js";
import { runPackage } from "./commands/package.js";
import { runSkillsSync } from "./commands/skillsSync.js";

const program = new Command();

program
  .name("ai-workspace")
  .description("Generate and adapt an AI workspace (Claude Code + GitHub Copilot) for any project.")
  .version(CLI_VERSION);

program
  .command("init")
  .description("Interactive wizard: detect stack, write workspace.config.yaml, render artifacts.")
  .option("--from <paths...>", "existing company assets to ingest (recorded for `import`)")
  .option("-y, --yes", "accept defaults where possible (implies --simple)")
  .option("--simple", "few questions + smart defaults (accept the detected stack)")
  .option("--advanced", "fully parametrized wizard (control every layer)")
  .action(async (opts) => {
    try {
      await runInit(process.cwd(), opts);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("detect")
  .description("Detect the stack (languages/frameworks/environments). Reads manifests only; writes nothing.")
  .option("--json", "emit raw JSON (a deterministic seed for the configure-workspace skill / tooling)")
  .action((opts) => {
    try {
      runDetect(process.cwd(), opts);
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("sync")
  .description("Re-render all artifacts from workspace.config.yaml (idempotent).")
  .option("--check", "preview what sync would restore without writing (self-heal preview)")
  .action((opts) => {
    try {
      runSync(process.cwd(), { check: opts.check });
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Lint the workspace: token budgets and key artifacts.")
  .option("--strict", "also verify base integrity against the manifest (non-zero exit on tampering)")
  .action((opts) => {
    try {
      runDoctor(process.cwd());
      if (opts.strict) runVerify(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("verify")
  .description("Verify base integrity against .ai-workspace/manifest.json (CI gate; non-zero exit on tampering).")
  .action(() => {
    try {
      runVerify(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("add")
  .description("Add a module (language|framework|environment|mcp) to the config and re-render.")
  .argument("<type>", "module type: language | framework | environment | mcp")
  .argument("<id>", "module id, e.g. go, nextjs, docker, context7")
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
  .description("Remove a module (language|framework|environment|mcp) from the config and re-render.")
  .argument("<type>", "module type: language | framework | environment | mcp")
  .argument("<id>", "module id, e.g. go, nextjs, docker, context7")
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

const packs = program.command("packs").description("Manage vendored company packs (git, pinned by ref).");
packs
  .command("sync")
  .description("Vendor the git company packs from `company.packs` into .ai-workspace/packs/ (committed, pinned).")
  .action(() => {
    try {
      runPacksSync(process.cwd());
    } catch (err) {
      console.error(pc.red(`\n${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
