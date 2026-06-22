import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, readdirSync, cpSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { parsePackManifest, companyPacksDir } from "../generate/stackPacks.js";
import { isReservedNamespace } from "../generate/naming.js";

/** A parsed company-pack source: a git URL pinned to an explicit ref (tag/sha/branch). */
interface PackSource {
  url: string;
  ref: string;
}

/** Parse `git+<url>#<ref>` (or `<url>#<ref>`). The `#<ref>` is **required** — packs are always pinned. */
export function parsePackSource(spec: string): PackSource {
  const s = spec.replace(/^git\+/, "");
  const hash = s.lastIndexOf("#");
  if (hash < 0) {
    throw new Error(`company pack "${spec}" is not pinned — append \`#<tag|sha|branch>\` (e.g. \`#v1.2.0\`).`);
  }
  const url = s.slice(0, hash);
  const ref = s.slice(hash + 1);
  if (!url || !ref) throw new Error(`company pack "${spec}" is malformed — expected \`git+<url>#<ref>\`.`);
  return { url, ref };
}

interface LockEntry {
  source: string;
  url: string;
  ref: string;
  sha: string;
  ids: string[];
}

/**
 * Vendor the git company packs declared in `company.packs` into `.ai-workspace/packs/` (committed), each
 * pinned by ref (ADR 0003 F2c). External packs may NOT claim the reserved `aiws` namespace. Writes a
 * `packs-lock.json` with the resolved sha for reproducibility. Network only at sync time, never at generate.
 */
export function runPacksSync(cwd: string): void {
  const config = loadConfig(cwd);
  const sources = config.company.packs;
  const dest = companyPacksDir(cwd);

  if (sources.length === 0) {
    console.log(pc.yellow("\nNo company packs declared (`company.packs` is empty). Nothing to sync.\n"));
    return;
  }

  console.log(pc.bold(`\nSyncing ${sources.length} company pack source(s) → ${pc.cyan(".ai-workspace/packs/")}\n`));

  // Rebuild the vendored set from scratch so removed sources don't linger.
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  const lock: LockEntry[] = [];
  for (const spec of sources) {
    const { url, ref } = parsePackSource(spec);
    const tmp = mkdtempSync(join(tmpdir(), "aiws-pack-"));
    try {
      execFileSync("git", ["clone", "--depth", "1", "--branch", ref, "--quiet", url, tmp], { stdio: ["ignore", "ignore", "pipe"] });
      const sha = execFileSync("git", ["-C", tmp, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      const ids = vendorPacksFromClone(tmp, dest, spec);
      lock.push({ source: spec, url, ref, sha, ids });
      console.log(`  ${pc.green("✔")} ${spec} ${pc.dim(`(${sha.slice(0, 10)})`)} → ${ids.join(", ") || pc.dim("no packs found")}`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  writeFileSync(join(dest, "packs-lock.json"), JSON.stringify({ version: 1, packs: lock }, null, 2) + "\n", "utf8");
  console.log(pc.green(`\n✔ Vendored ${lock.reduce((n, l) => n + l.ids.length, 0)} pack(s). Commit \`.ai-workspace/packs/\`.\n`));
}

/** Copy each `skill-packs/<id>/` from a cloned repo into `dest/<id>/`, guarding the reserved namespace. */
function vendorPacksFromClone(clone: string, dest: string, spec: string): string[] {
  const src = join(clone, "skill-packs");
  if (!existsSync(src)) {
    throw new Error(`company pack "${spec}" has no \`skill-packs/\` directory at its root.`);
  }
  const ids: string[] = [];
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(src, entry.name, "pack.yaml");
    if (!existsSync(manifestPath)) continue;
    const manifest = parsePackManifest(parse(readFileSync(manifestPath, "utf8")));
    if (isReservedNamespace(manifest.id)) {
      throw new Error(`company pack "${manifest.id}" (from ${spec}) uses the reserved \`aiws\` namespace — only the base may. Use a \`corp-<handle>-\` id.`);
    }
    cpSync(join(src, entry.name), join(dest, manifest.id), { recursive: true });
    ids.push(manifest.id);
  }
  return ids;
}
