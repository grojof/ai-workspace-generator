import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import type { Config } from "../config/schema.js";
import { docsPaths } from "./paths.js";
import { resolveDocContract } from "./docContract.js";
import { extractLocalLinks } from "../util/links.js";

/**
 * Doc-coherence checks for `doctor` (0016a). Pure over the filesystem + the doc contract, so they are unit-
 * testable without driving the CLI. Conservative by design — both findings are `warn`-level and scoped to the
 * **maintained** docs (the contract, `docs/project/`, and top-level `docs/*.md`); the SDD store under
 * `docs/development/{changes,specs}/` is self-managed by the change lifecycle and intentionally out of scope.
 */
export interface DocCoherence {
  /** A maintained doc links a workspace-relative path that doesn't exist. */
  dangling: { file: string; target: string }[];
  /** A maintained doc the contract doesn't declare and nothing links to. */
  orphans: string[];
}

const ROOT_WHITELIST = /^(README|LICENSE|SECURITY|CHANGELOG|CONTRIBUTING)/i;

function toRel(cwd: string, abs: string): string {
  return relative(cwd, abs).split("\\").join("/");
}

/** Recursively list `.md` files under `dir` (absolute paths); empty if `dir` is missing. */
function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...listMarkdown(abs));
    else if (name.endsWith(".md")) out.push(abs);
  }
  return out;
}

/** Top-level `*.md` files directly inside `dir` (non-recursive). */
function topLevelMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((n) => join(dir, n))
    .filter((a) => a.endsWith(".md") && statSync(a).isFile());
}

export function checkDocCoherence(cwd: string, config: Config): DocCoherence {
  const p = docsPaths(config);
  const contract = resolveDocContract(config);
  const contractAbs = new Set(contract.map((e) => resolve(cwd, e.path)));
  const projectDir = resolve(cwd, p.project);
  const docsDir = resolve(cwd, "docs");

  // Scan for links: contract docs + project docs + top-level docs/*.md + repo-root *.md (so a doc referenced
  // only from README/AGENTS.md isn't mistaken for an orphan). Link-scan is broad; orphan candidates are narrow.
  const scan = new Set<string>();
  for (const e of contract) {
    const a = resolve(cwd, e.path);
    if (e.path.endsWith(".md") && existsSync(a)) scan.add(a);
  }
  for (const a of listMarkdown(projectDir)) scan.add(a);
  for (const a of topLevelMarkdown(docsDir)) scan.add(a);
  for (const a of topLevelMarkdown(cwd)) scan.add(a);

  const dangling: DocCoherence["dangling"] = [];
  const linked = new Set<string>();
  for (const abs of scan) {
    for (const target of extractLocalLinks(readFileSync(abs, "utf8"))) {
      const resolved = resolve(dirname(abs), target);
      linked.add(resolved);
      if (!existsSync(resolved)) dangling.push({ file: toRel(cwd, abs), target });
    }
  }

  // Orphan candidates: maintained docs only (project docs + top-level docs/*.md).
  const orphans: string[] = [];
  const candidates = new Set<string>([...listMarkdown(projectDir), ...topLevelMarkdown(docsDir)]);
  for (const abs of candidates) {
    if (contractAbs.has(abs) || linked.has(abs)) continue;
    if (ROOT_WHITELIST.test(abs.split(/[/\\]/).pop() ?? "")) continue;
    orphans.push(toRel(cwd, abs));
  }

  dangling.sort((a, b) => a.file.localeCompare(b.file) || a.target.localeCompare(b.target));
  orphans.sort();
  return { dangling, orphans };
}
