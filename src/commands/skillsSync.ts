import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, mkdtempSync, copyFileSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import pc from "picocolors";
import { parse } from "yaml";
import { skillPacksDir } from "../generate/stackPacks.js";

/**
 * `skills sync` — Mechanism A of the skills-as-data model (0003): pull the upstream skill source
 * (agent-skills, MIT) at a pinned ref, diff it against the vendored BASE, and on `--apply` update
 * `vendor/agent-skills/` + propagate the base into `skill-packs/<id>/` while PRESERVING our `pack.yaml`
 * and `overlay.*.md` (the company overlay is never touched). Dry-run by default.
 */

/** Generator repo root (where `vendor/` and `skill-packs/` live). */
function repoRoot(): string {
  return resolve(skillPacksDir(), "..");
}

function listRel(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listRel(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

/** Binary/asset extensions we never vendor (excluded by .gitignore) — skipped in diff, copy and propagation. */
const BINARY = /\.(png|jpe?g|gif|ico|ttf|otf|woff2?|pdf|zip|skill|pptx|potx|dotx|docx|xlsx|xltx|thmx)$/i;

/**
 * Map of repo-relative path → sha256 for every TEXT file under `dir` (empty if missing). Binaries are
 * skipped (we don't vendor them). Line endings are normalized to LF before hashing — the diff reflects
 * real content changes, not CRLF/LF noise between a fresh upstream clone and the git-normalized vendor copy.
 */
export function hashTree(dir: string): Map<string, string> {
  const m = new Map<string, string>();
  if (!existsSync(dir)) return m;
  for (const rel of listRel(dir)) {
    if (BINARY.test(rel)) continue;
    const normalized = readFileSync(join(dir, rel), "utf8").replace(/\r\n?/g, "\n");
    m.set(rel, createHash("sha256").update(normalized).digest("hex"));
  }
  return m;
}

export interface TreeDiff {
  added: string[];
  changed: string[];
  removed: string[];
}

/** Pure diff of two hash trees. */
export function diffTrees(oldT: Map<string, string>, newT: Map<string, string>): TreeDiff {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];
  for (const [k, v] of newT) {
    if (!oldT.has(k)) added.push(k);
    else if (oldT.get(k) !== v) changed.push(k);
  }
  for (const k of oldT.keys()) if (!newT.has(k)) removed.push(k);
  return { added: added.sort(), changed: changed.sort(), removed: removed.sort() };
}

function copyInto(srcFile: string, destFile: string): void {
  mkdirSync(dirname(destFile), { recursive: true });
  copyFileSync(srcFile, destFile);
}

/** Highest semver tag of a remote repo (or null). */
function latestTag(repoUrl: string): string | null {
  try {
    const out = execSync(`git ls-remote --tags --refs "${repoUrl}"`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
    const tags = [...out.matchAll(/refs\/tags\/(v?\d+\.\d+\.\d+)\b/g)].map((m) => m[1]!);
    if (tags.length === 0) return null;
    return tags.sort((a, b) => {
      const pa = a.replace(/^v/, "").split(".").map(Number);
      const pb = b.replace(/^v/, "").split(".").map(Number);
      return pa[0]! - pb[0]! || pa[1]! - pb[1]! || pa[2]! - pb[2]!;
    })[tags.length - 1]!;
  } catch {
    return null;
  }
}

/** Copy the SKILL.md + references/ base from `vendor/<base>` into each pack, preserving pack.yaml + overlays. */
function propagateToPacks(root: string): string[] {
  const packsRoot = join(root, "skill-packs");
  const touched: string[] = [];
  if (!existsSync(packsRoot)) return touched;
  for (const e of readdirSync(packsRoot, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const manifestPath = join(packsRoot, e.name, "pack.yaml");
    if (!existsSync(manifestPath)) continue;
    const manifest = parse(readFileSync(manifestPath, "utf8")) as { base?: string; agents?: string[] };
    let didCopy = false;
    // Copy the WHOLE base tree (SKILL.md + references/ + scripts/ + examples/ + LICENSE.txt …): the base is
    // pure upstream content, so pack.yaml and overlay.*.md (which live only in the pack, never in the base)
    // are preserved. Binaries are never vendored, so they are skipped here too.
    if (manifest.base) {
      const baseDir = join(root, manifest.base);
      if (existsSync(baseDir)) {
        for (const rel of listRel(baseDir)) {
          if (BINARY.test(rel)) continue;
          copyInto(join(baseDir, rel), join(packsRoot, e.name, rel));
        }
        didCopy = true;
      }
    }
    // Companion subagents: refresh `agents/<name>.md` from each vendored `<dir>/SKILL.md`.
    for (const agentPath of manifest.agents ?? []) {
      const src = join(root, agentPath, "SKILL.md");
      if (!existsSync(src)) continue;
      copyInto(src, join(packsRoot, e.name, "agents", `${basename(agentPath)}.md`));
      didCopy = true;
    }
    if (didCopy) touched.push(e.name);
  }
  return touched;
}

function printDiff(label: string, d: TreeDiff): boolean {
  const total = d.added.length + d.changed.length + d.removed.length;
  if (total === 0) {
    console.log(`  ${pc.dim(`${label}: up to date`)}`);
    return false;
  }
  console.log(`  ${pc.bold(label)}: ${pc.green(`+${d.added.length}`)} ${pc.yellow(`~${d.changed.length}`)} ${pc.red(`-${d.removed.length}`)}`);
  for (const f of d.added) console.log(`    ${pc.green("+")} ${f}`);
  for (const f of d.changed) console.log(`    ${pc.yellow("~")} ${f}`);
  for (const f of d.removed) console.log(`    ${pc.red("-")} ${f}`);
  return true;
}

interface VendorEntry {
  from: string;
  to: string;
}
interface SourceJson {
  source: string;
  repo: string;
  ref: string;
  sha?: string;
  license?: string;
  fetched?: string;
  vendored: (string | VendorEntry)[];
}
interface VendorSource {
  name: string;
  dir: string;
  json: SourceJson;
}

/** Every `vendor/<name>/.source.json` (a vendored upstream source). */
function listSources(root: string): VendorSource[] {
  const vroot = join(root, "vendor");
  if (!existsSync(vroot)) return [];
  const out: VendorSource[] = [];
  for (const e of readdirSync(vroot, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const jp = join(vroot, e.name, ".source.json");
    if (!existsSync(jp)) continue;
    out.push({ name: e.name, dir: join(vroot, e.name), json: JSON.parse(readFileSync(jp, "utf8")) as SourceJson });
  }
  return out;
}

/** Normalize a `vendored` entry (string → from==to). `from` is the upstream path, `to` the vendor-relative path. */
function entries(vendored: (string | VendorEntry)[]): VendorEntry[] {
  return vendored.map((v) => (typeof v === "string" ? { from: v, to: v } : v));
}

/** Sync one vendored source. Returns true if `--apply` changed it. */
function syncSource(s: VendorSource, opts: { ref?: string; apply?: boolean; source?: string }): boolean {
  const src = s.json;
  // `--ref` only applies when a single source is targeted; otherwise each source uses its latest tag / pin.
  const ref = (opts.source ? opts.ref : undefined) ?? latestTag(src.repo) ?? src.ref;
  console.log(pc.bold(`\nSkills sync — ${src.source}`));
  console.log(`  current pin: ${pc.cyan(src.ref)}  →  target: ${pc.cyan(ref)}`);

  const tmp = mkdtempSync(join(tmpdir(), "askills-sync-"));
  try {
    execSync(`git clone --quiet --depth 1 --branch "${ref}" "${src.repo}" "${tmp}"`, { stdio: ["ignore", "ignore", "pipe"] });
    const newSha = execSync("git rev-parse HEAD", { cwd: tmp, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();

    let anyChange = false;
    for (const { from, to } of entries(src.vendored)) {
      const d = diffTrees(hashTree(join(s.dir, to)), hashTree(join(tmp, from)));
      anyChange = printDiff(`${s.name}/${to}`, d) || anyChange;
    }

    if (!opts.apply) return false;
    if (!anyChange && ref === src.ref) {
      console.log(pc.dim("  Already up to date."));
      return false;
    }

    // Apply: replace the vendored BASE subset, re-seal the pin.
    for (const { from, to } of entries(src.vendored)) {
      const dest = join(s.dir, to);
      rmSync(dest, { recursive: true, force: true });
      for (const rel of listRel(join(tmp, from))) {
        if (BINARY.test(rel)) continue; // never vendor binaries (proprietary fonts, images)
        copyInto(join(tmp, from, rel), join(dest, rel));
      }
    }
    if (existsSync(join(tmp, "LICENSE"))) copyInto(join(tmp, "LICENSE"), join(s.dir, "LICENSE"));
    src.ref = ref;
    src.sha = newSha;
    src.fetched = new Date().toISOString().slice(0, 10);
    writeFileSync(join(s.dir, ".source.json"), `${JSON.stringify(src, null, 2)}\n`);
    console.log(pc.green(`  Applied ${s.name} @ ${ref}.`));
    return true;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function runSkillsSync(opts: { ref?: string; apply?: boolean; source?: string }): void {
  const root = repoRoot();
  let sources = listSources(root);
  if (opts.source) sources = sources.filter((s) => s.name === opts.source);
  if (sources.length === 0) {
    throw new Error(opts.source ? `No vendor/${opts.source}/.source.json found.` : "No vendored sources under vendor/*/.source.json.");
  }

  let applied = false;
  for (const s of sources) applied = syncSource(s, opts) || applied;

  if (opts.apply && applied) {
    const packs = propagateToPacks(root);
    console.log(pc.green(`\n  Propagated the base into packs: ${packs.join(", ") || "(none)"}.`));
    console.log(pc.dim("  Review `git diff`, run `npm run build && npm test`, bump TEMPLATES_VERSION if output changed, then commit.\n"));
  } else if (!opts.apply) {
    console.log(pc.yellow("\n  Dry run. Re-run with --apply to update vendor/ + skill-packs/ and re-seal the pin.\n"));
  } else {
    console.log(pc.green("\n  Already up to date — nothing to apply.\n"));
  }
}
