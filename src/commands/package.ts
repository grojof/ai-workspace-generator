import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join, relative, dirname } from "node:path";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { generate, type Artifact } from "../generate/index.js";
import { printArtifacts } from "../util/report.js";
import { names, pluginManifest, marketplaceManifest, installDoc } from "../generate/packaging.js";
import { zipSync, type ZipEntry } from "../util/zip.js";

/** Binary skill assets (templates, logos) — copied byte-for-byte into the plugin, never utf8-normalized. */
const BINARY_ASSET = /\.(png|jpe?g|gif|ico|pdf|zip|pptx|potx|ppsx|dotx|docx|xlsx|xltx|thmx|ttf|otf|woff2?)$/i;

/** Recursively list absolute file paths under `dir` (empty if missing). */
function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

/** Write bytes, reporting created/updated/unchanged (deterministic → re-run is a no-op). */
function writeBytes(cwd: string, absPath: string, data: Buffer, desc: string): Artifact {
  const before = existsSync(absPath) ? readFileSync(absPath) : null;
  const path = relative(cwd, absPath);
  if (before && before.equals(data)) return { path, desc, status: "unchanged" };
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, data);
  return { path, desc, status: before ? "updated" : "created" };
}

/** Write text via the same byte path so reporting matches; trailing newline for text files. */
function writeText(cwd: string, absPath: string, content: string, desc: string): Artifact {
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  return writeBytes(cwd, absPath, Buffer.from(normalized, "utf8"), desc);
}

/** Best-effort git remote for the install guide (`/plugin marketplace add <ref>`). */
function gitRemote(cwd: string): string {
  try {
    const url = execSync("git config --get remote.origin.url", { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return url.replace(/\.git$/, "");
  } catch {
    return "";
  }
}

/**
 * F6 — package the generated workspace for distribution: an umbrella Claude Code plugin served from this
 * repo as a private marketplace, plus per-skill zips for upload to a claude.ai organization. Idempotent.
 */
export function runPackage(cwd: string): void {
  const config = loadConfig(cwd);
  console.log(pc.bold(`\nPackaging ${pc.cyan(config.project.name)} → plugin + marketplace + org skills…\n`));

  // Ensure the in-repo artifacts are current, then project them into a plugin (another projection).
  generate(cwd, config);

  if (!config.targets.includes("claude")) {
    console.log(pc.yellow("  The `claude` target is not enabled — nothing to package.\n"));
    return;
  }

  const { plugin } = names(config);
  const pluginDir = resolve(cwd, "plugins", plugin);
  const skillsSrc = resolve(cwd, ".claude/skills");
  const commandsSrc = resolve(cwd, ".claude/commands");
  const out: Artifact[] = [];

  // 1. Umbrella plugin manifest.
  out.push(writeText(cwd, resolve(pluginDir, ".claude-plugin/plugin.json"), JSON.stringify(pluginManifest(config), null, 2), "plugin manifest"));

  // 2. Project skills + commands into the plugin (skills/, commands/). Binary assets are copied byte-for-byte.
  for (const f of listFiles(skillsSrc)) {
    const dest = resolve(pluginDir, "skills", relative(skillsSrc, f));
    if (BINARY_ASSET.test(f)) {
      out.push(writeBytes(cwd, dest, readFileSync(f), "plugin skill asset"));
      continue;
    }
    out.push(writeText(cwd, dest, readFileSync(f, "utf8"), "plugin skill"));
  }
  for (const f of listFiles(commandsSrc)) {
    out.push(writeText(cwd, resolve(pluginDir, "commands", relative(commandsSrc, f)), readFileSync(f, "utf8"), "plugin command"));
  }

  // 3. Root marketplace catalog — this repo is the marketplace.
  out.push(writeText(cwd, resolve(cwd, ".claude-plugin/marketplace.json"), JSON.stringify(marketplaceManifest(config), null, 2), "marketplace catalog"));

  // 4. Per-skill org zips (claude.ai Organization → Skills upload). SKILL.md at zip root.
  const skillIds: string[] = [];
  if (existsSync(skillsSrc)) {
    for (const e of readdirSync(skillsSrc, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith("_")) continue;
      const dir = join(skillsSrc, e.name);
      if (!existsSync(join(dir, "SKILL.md"))) continue;
      skillIds.push(e.name);
      const entries: ZipEntry[] = listFiles(dir).map((f) => ({
        name: relative(dir, f).split(/[\\/]/).join("/"),
        data: readFileSync(f),
      }));
      // claude.ai requires SKILL.md at the zip root and reads it first; keep the rest deterministic for idempotency.
      entries.sort((a, b) => (a.name === "SKILL.md" ? -1 : b.name === "SKILL.md" ? 1 : a.name.localeCompare(b.name)));
      out.push(writeBytes(cwd, resolve(cwd, "dist/org-skills", `${e.name}.zip`), zipSync(entries), "org skill zip"));
    }
  }

  // 5. Install guide (three surfaces).
  out.push(writeText(cwd, resolve(cwd, "dist/INSTALL.md"), installDoc(config, gitRemote(cwd), skillIds), "install guide"));

  printArtifacts(out);
  console.log(pc.green(`\n✔ Packaged ${skillIds.length} skills. See dist/INSTALL.md for the three install surfaces.\n`));
}
