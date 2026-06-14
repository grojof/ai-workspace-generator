import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { upsertBlocks, type CommentStyle } from "./managed-region.js";

export type WriteStatus = "created" | "updated" | "unchanged";

export interface WriteResult {
  path: string;
  status: WriteStatus;
}

// --- Dry-run support (used by `upgrade --check` to preview without writing) ---
let dryRun = false;
const planned = new Map<string, string>();

export function setDryRun(on: boolean): void {
  dryRun = on;
  planned.clear();
}

/** Intended file contents recorded during a dry run (absolute path → content). */
export function getPlanned(): Map<string, string> {
  return planned;
}

function commit(absPath: string, content: string): void {
  if (dryRun) {
    planned.set(absPath, content);
    return;
  }
  ensureDir(absPath);
  writeFileSync(absPath, content, "utf8");
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function read(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

/** Write a fully-managed file (overwrite). Reports whether it changed. */
export function writeFile(absPath: string, content: string): WriteResult {
  const before = read(absPath);
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  if (before === normalized) {
    return { path: absPath, status: "unchanged" };
  }
  commit(absPath, normalized);
  return { path: absPath, status: before ? "updated" : "created" };
}

/**
 * Write/update a file that mixes generated managed blocks with user content.
 * Existing user text outside the markers is preserved.
 */
export function writeManaged(
  absPath: string,
  style: CommentStyle,
  blocks: Array<{ id: string; content: string }>,
): WriteResult {
  const before = read(absPath);
  const next = upsertBlocks(before, style, blocks);
  const normalized = next.endsWith("\n") ? next : `${next}\n`;
  if (before === normalized) {
    return { path: absPath, status: "unchanged" };
  }
  commit(absPath, normalized);
  return { path: absPath, status: before ? "updated" : "created" };
}

/** Only create the file if it is missing; never overwrite (for user-owned scaffolds). */
export function writeIfMissing(absPath: string, content: string): WriteResult {
  if (existsSync(absPath) || (dryRun && planned.has(absPath))) {
    return { path: absPath, status: "unchanged" };
  }
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  commit(absPath, normalized);
  return { path: absPath, status: "created" };
}
