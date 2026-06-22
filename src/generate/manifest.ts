import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { writeFile, isDryRun, type WriteResult } from "../render/writer.js";
import { TEMPLATES_VERSION } from "../version.js";
import { AIWS } from "./naming.js";

/**
 * The provenance/integrity manifest (ADR 0003 Part E). Records every base-owned artifact with its source and
 * a fingerprint so `verify` can detect tampering, renamed/orphaned markers, in-region drift and deletions. We
 * cannot *prevent* edits to plain files — we make integrity verifiable and restorable.
 */
export const MANIFEST_PATH = ".ai-workspace/manifest.json";

export interface ManifestEntry {
  /** Workspace-relative, `/`-separated. */
  path: string;
  /** `aiws@<TEMPLATES_VERSION>` — who owns it and at which template version. */
  source: string;
  /** `managed` = our regions mixed with user prose (hash regions only); `file` = we own the whole file. */
  kind: "managed" | "file";
  /** sha256 of the managed regions (managed) or the whole content (file). */
  hash: string;
  /** For `managed`: the ordered `aiws:*` block ids present (detects renamed/orphaned/missing markers). */
  blocks?: string[];
}

export interface Manifest {
  version: 1;
  source: string;
  entries: ManifestEntry[];
}

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

const SOURCE = `${AIWS}@${TEMPLATES_VERSION}`;

/** A file whose base regions are mixed with user prose — only the `aiws:*` regions are ours. */
export function isManagedFile(rel: string): boolean {
  return /(^|\/)(AGENTS\.md|CLAUDE\.md)$/.test(rel) || /(^|\/)\.github\/copilot-instructions\.md$/.test(rel);
}

/** A file we own end to end (overwritten on every sync). */
export function isOwnedFile(rel: string): boolean {
  return (
    /(^|\/)\.claude\/skills\/aiws-[^/]+\//.test(rel) ||
    // Generated shared references the base owns + regenerates (e.g. `_shared/aiws-sdd-convention.md`).
    /(^|\/)\.claude\/skills\/_shared\/[^/]+\.md$/.test(rel) ||
    /(^|\/)\.claude\/commands\/aiws-[^/]+\.md$/.test(rel) ||
    /(^|\/)\.github\/prompts\/aiws-[^/]+\.prompt\.md$/.test(rel)
  );
}

/** Hash the concatenated `aiws:*` managed regions (begin..end inclusive) and list their ids, in order. */
export function managedRegions(content: string): { hash: string; blocks: string[] } {
  const blocks: string[] = [];
  const idRe = /<!-- ai-workspace:begin:(aiws:[a-zA-Z0-9:-]+) -->/g;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(content))) blocks.push(m[1]);
  const parts: string[] = [];
  for (const id of blocks) {
    const begin = `<!-- ai-workspace:begin:${id} -->`;
    const end = `<!-- ai-workspace:end:${id} -->`;
    const bi = content.indexOf(begin);
    const ei = content.indexOf(end);
    if (bi >= 0 && ei > bi) parts.push(content.slice(bi, ei + end.length));
  }
  return { hash: sha256(parts.join("\n")), blocks };
}

/** Fingerprint a single base artifact, or null if it is not base-owned / no longer present. */
export function fingerprint(cwd: string, rel: string): ManifestEntry | null {
  const abs = resolve(cwd, rel);
  if (!existsSync(abs)) return null;
  const content = readFileSync(abs, "utf8");
  if (isManagedFile(rel)) {
    const { hash, blocks } = managedRegions(content);
    if (blocks.length === 0) return null; // a managed file with no aiws regions isn't ours to track
    return { path: rel, source: SOURCE, kind: "managed", hash, blocks };
  }
  if (isOwnedFile(rel)) {
    return { path: rel, source: SOURCE, kind: "file", hash: sha256(content) };
  }
  return null;
}

/** Build the manifest from the artifacts `generate` produced (reads their content from disk). */
export function buildManifest(cwd: string, artifactPaths: string[]): Manifest {
  const entries: ManifestEntry[] = [];
  const seen = new Set<string>();
  for (const rel of artifactPaths) {
    if (rel === MANIFEST_PATH || seen.has(rel)) continue;
    const entry = fingerprint(cwd, rel);
    if (entry) {
      entries.push(entry);
      seen.add(rel);
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { version: 1, source: SOURCE, entries };
}

/**
 * Write `.ai-workspace/manifest.json` as the LAST step of generate (after every other artifact is on disk).
 * Skipped in dry-run (`upgrade --check`) since it fingerprints files that were never written. Idempotent:
 * identical inputs ⇒ identical manifest ⇒ `unchanged`.
 */
export function writeManifest(cwd: string, artifactPaths: string[]): WriteResult | null {
  if (isDryRun()) return null;
  const manifest = buildManifest(cwd, artifactPaths);
  return writeFile(resolve(cwd, MANIFEST_PATH), JSON.stringify(manifest, null, 2));
}
