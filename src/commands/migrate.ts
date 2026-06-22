import { existsSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { resolveRepos, unionStack, type Config } from "../config/schema.js";
import { composeBlocks } from "../generate/agents.js";
import { aiwsBlockId, AIWS } from "../generate/naming.js";

/**
 * One-shot upgrade migrations that rewrite a consumer repo from the pre-namespace layout to the
 * `aiws` namespace (ADR 0003 F1b). Both steps are idempotent: a second run finds nothing to do.
 *
 *  - {@link migrateBlockIds} rewrites legacy bare governance-spine markers to `aiws:*` in place, so
 *    the next `generate` updates the existing regions instead of appending duplicates next to orphans.
 *  - {@link pruneRenamedOrphans} deletes the pre-rename skill folders / command + prompt files left
 *    behind when a base artifact moved to the `aiws-` namespace (F1a), guarded so it never removes
 *    anything the generator still emits.
 */

const BEGIN = (id: string): string => `<!-- ai-workspace:begin:${id} -->`;
const END = (id: string): string => `<!-- ai-workspace:end:${id} -->`;

/** The governance-spine files that carry composed `aiws:*` managed blocks (HTML markers). */
function spineFiles(cwd: string, config: Config): string[] {
  const files = [resolve(cwd, "AGENTS.md")];
  if (config.targets.includes("claude")) {
    files.push(resolve(cwd, "CLAUDE.md"));
    for (const repo of resolveRepos(config)) {
      if (repo.path !== ".") files.push(resolve(cwd, repo.path, "CLAUDE.md"));
    }
  }
  if (config.targets.includes("copilot")) {
    files.push(resolve(cwd, ".github/copilot-instructions.md"));
  }
  return files;
}

/**
 * The bare legacy ids this repo owns, derived from what it currently composes (so dynamic per-stack
 * `lang-*`/`fw-*`/`env-*` ids are covered exactly) plus the inline `claude`/`copilot-header` blocks.
 */
function ownedLegacyIds(config: Config): string[] {
  const prefix = `${AIWS}:`;
  const composed = composeBlocks(unionStack(config)).map((b) => b.id); // already aiws:*
  const all = [...composed, aiwsBlockId("claude"), aiwsBlockId("copilot-header")];
  return [...new Set(all)].map((id) => id.slice(prefix.length));
}

export interface BlockIdMigration {
  file: string; // relative to cwd
  count: number; // markers rewritten
}

/** Rewrite legacy bare spine markers → `aiws:*` across the consumer's governance files. */
export function migrateBlockIds(cwd: string, config: Config): BlockIdMigration[] {
  const legacyIds = ownedLegacyIds(config);
  const changes: BlockIdMigration[] = [];
  for (const abs of spineFiles(cwd, config)) {
    if (!existsSync(abs)) continue;
    const before = readFileSync(abs, "utf8");
    let after = before;
    let count = 0;
    for (const id of legacyIds) {
      // Anchor on the full marker so `lang-go` never partial-matches `lang-google`. Idempotent: the
      // namespaced marker `:begin:aiws:lang-go -->` does not contain the legacy `:begin:lang-go -->`.
      for (const [legacy, next] of [
        [BEGIN(id), BEGIN(aiwsBlockId(id))],
        [END(id), END(aiwsBlockId(id))],
      ] as const) {
        if (after.includes(legacy)) {
          after = after.split(legacy).join(next);
          count++;
        }
      }
    }
    if (count > 0) {
      writeFileSync(abs, after, "utf8");
      changes.push({ file: relPath(cwd, abs), count });
    }
  }
  return changes;
}

function relPath(cwd: string, abs: string): string {
  return abs
    .slice(cwd.length)
    .replace(/^[/\\]+/, "")
    .split("\\")
    .join("/");
}

/**
 * The pre-rename sibling of an `aiws-` namespaced artifact, or null if `rel` is not such an artifact.
 * Skills resolve to their folder (removed recursively); commands/prompts to the single file.
 */
function legacySiblingOf(rel: string): { path: string; isDir: boolean } | null {
  let m = rel.match(/^(.*\/skills\/)aiws-([^/]+)\/SKILL\.md$/);
  if (m) return { path: `${m[1]}${m[2]}`, isDir: true };
  m = rel.match(/^(.*\/commands\/)aiws-(.+)\.md$/);
  if (m) return { path: `${m[1]}${m[2]}.md`, isDir: false };
  m = rel.match(/^(.*\/prompts\/)aiws-(.+)\.prompt\.md$/);
  if (m) return { path: `${m[1]}${m[2]}.prompt.md`, isDir: false };
  // Shared references under `_shared/` that gained the `aiws-` prefix (e.g. sdd-convention.md).
  m = rel.match(/^(.*\/skills\/_shared\/)aiws-(.+\.md)$/);
  if (m) return { path: `${m[1]}${m[2]}`, isDir: false };
  return null;
}

/**
 * Delete pre-rename skill folders / command + prompt files orphaned by the `aiws-` rename (F1a).
 * `currentRelPaths` is the set of artifacts the current `generate` produced; a legacy sibling is removed
 * only when it exists on disk AND is not itself still generated, so live packs are never touched.
 */
export function pruneRenamedOrphans(cwd: string, currentRelPaths: string[]): string[] {
  const current = new Set(currentRelPaths.map((p) => p.split("\\").join("/")));
  const removed: string[] = [];
  for (const rel of current) {
    const legacy = legacySiblingOf(rel);
    if (!legacy || current.has(legacy.path)) continue;
    const abs = resolve(cwd, legacy.path);
    if (!existsSync(abs)) continue;
    if (legacy.isDir) {
      if (!statSync(abs).isDirectory()) continue;
      rmSync(abs, { recursive: true, force: true });
      removed.push(`${legacy.path}/`);
    } else {
      rmSync(abs, { force: true });
      removed.push(legacy.path);
    }
  }
  return removed;
}
