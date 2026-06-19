import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, lstatSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join, relative, dirname } from "node:path";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { resolveRepos, type Config } from "../config/schema.js";
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

/**
 * Distribution source roots: the workspace root, then each linked child repo (`path !== "."`). Empty
 * `repos[]` ⇒ just the root, so single-repo packaging is unchanged. Multi-repo (0004) aggregates the
 * per-repo `.claude/` outputs that 0003 places under each child.
 */
function sourceRoots(cwd: string, config: Config): string[] {
  return [cwd, ...resolveRepos(config).filter((r) => r.path !== ".").map((r) => resolve(cwd, r.path))];
}

/**
 * Top-level entries (skill dirs, command/agent files) under `<root>/<subdir>` across all source roots,
 * de-duplicated by name with **first-root-wins** (root before children, children in `resolveRepos` order).
 */
function collectEntries(roots: string[], subdir: string): Array<{ name: string; path: string }> {
  const seen = new Set<string>();
  const out: Array<{ name: string; path: string }> = [];
  for (const root of roots) {
    const base = resolve(root, subdir);
    if (!existsSync(base)) continue;
    for (const e of readdirSync(base, { withFileTypes: true })) {
      if (seen.has(e.name)) continue;
      seen.add(e.name);
      out.push({ name: e.name, path: join(base, e.name) });
    }
  }
  return out;
}

/**
 * Project a de-duplicated top-level tree (`<root>/<subdir>` across source roots) into `destBase`, preserving
 * each entry's relative layout. Binary assets are copied byte-for-byte; everything else as text.
 */
function projectTree(cwd: string, roots: string[], subdir: string, destBase: string, desc: string, out: Artifact[]): void {
  for (const { name, path } of collectEntries(roots, subdir)) {
    const files = lstatSync(path).isDirectory() ? listFiles(path) : [path];
    for (const f of files) {
      const rel = f === path ? name : join(name, relative(path, f));
      const dest = resolve(destBase, rel);
      out.push(
        BINARY_ASSET.test(f)
          ? writeBytes(cwd, dest, readFileSync(f), `${desc} asset`)
          : writeText(cwd, dest, readFileSync(f, "utf8"), desc),
      );
    }
  }
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
  // Aggregate distributable sources from the workspace root + every linked child repo (0004). 0003 places
  // per-repo stack skills (and their companion agents) under each child's `.claude/`.
  const roots = sourceRoots(cwd, config);
  const out: Artifact[] = [];

  // 1. Umbrella plugin manifest.
  out.push(writeText(cwd, resolve(pluginDir, ".claude-plugin/plugin.json"), JSON.stringify(pluginManifest(config), null, 2), "plugin manifest"));

  // 2. Project skills + commands + companion agents into the plugin, aggregated + deduped across all roots.
  projectTree(cwd, roots, ".claude/skills", resolve(pluginDir, "skills"), "plugin skill", out);
  projectTree(cwd, roots, ".claude/commands", resolve(pluginDir, "commands"), "plugin command", out);
  projectTree(cwd, roots, ".claude/agents", resolve(pluginDir, "agents"), "plugin agent", out);

  // 3. Root marketplace catalog — this repo is the marketplace.
  out.push(writeText(cwd, resolve(cwd, ".claude-plugin/marketplace.json"), JSON.stringify(marketplaceManifest(config), null, 2), "marketplace catalog"));

  // 4. Per-skill org zips (claude.ai Organization → Skills upload), from the aggregated skill set. SKILL.md
  //    at zip root. De-duped by id (first-wins) so the same id from two repos yields a single zip.
  const skillIds: string[] = [];
  for (const { name, path: dir } of collectEntries(roots, ".claude/skills")) {
    if (name.startsWith("_") || !lstatSync(dir).isDirectory() || !existsSync(join(dir, "SKILL.md"))) continue;
    skillIds.push(name);
    const entries: ZipEntry[] = listFiles(dir).map((f) => ({
      name: relative(dir, f).split(/[\\/]/).join("/"),
      data: readFileSync(f),
    }));
    // claude.ai requires SKILL.md at the zip root and reads it first; keep the rest deterministic for idempotency.
    entries.sort((a, b) => (a.name === "SKILL.md" ? -1 : b.name === "SKILL.md" ? 1 : a.name.localeCompare(b.name)));
    out.push(writeBytes(cwd, resolve(cwd, "dist/org-skills", `${name}.zip`), zipSync(entries), "org skill zip"));
  }

  // 5. Install guide (three surfaces).
  out.push(writeText(cwd, resolve(cwd, "dist/INSTALL.md"), installDoc(config, gitRemote(cwd), skillIds), "install guide"));

  printArtifacts(out);
  console.log(pc.green(`\n✔ Packaged ${skillIds.length} skills. See dist/INSTALL.md for the three install surfaces.\n`));
}
