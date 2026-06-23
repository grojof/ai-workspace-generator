import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { renderTemplate } from "../render/engine.js";
import { writeFile, type WriteResult } from "../render/writer.js";

/**
 * Stack awareness in AGENTS.md is a compact, version-pointing line per active stack entry (change 0018). The
 * per-stack prose matrix was replaced by one evergreen `references/engineering-practices.md` (the craft
 * baseline); stack- and project-specific rules live in skill packs. AGENTS.md keeps only a **context7 pointer**
 * per stack id — no per-stack body file and no Copilot projection are generated. Layer-0 governance never moves
 * here.
 */

export type StackType = "language" | "framework" | "environment";
export interface StackItem {
  id: string;
  version: string;
}

const LAYER: Record<StackType, number> = { language: 1, framework: 2, environment: 3 };

/** The compact AGENTS.md block content for a stack entry: a heading + a single inline context7 pointer. */
export function stackPointer(type: StackType, entry: StackItem): string {
  const head =
    type === "environment"
      ? `## ${entry.id} (Layer 3 — environment) · ${entry.version}`
      : `## ${entry.id} (Layer ${LAYER[type]} — ${type}) · target v${entry.version}`;
  const ctx7 =
    type === "environment"
      ? `> Query **context7** for \`${entry.id}\` setup and best practices.`
      : `> Query **context7** for \`${entry.id}@${entry.version}\` best practices.`;
  return `${head}\n${ctx7}`;
}

/** Ensure a trailing newline (generated files end with one). */
function nl(s: string): string {
  return s.endsWith("\n") ? s : `${s}\n`;
}

/**
 * Emit the evergreen, language-agnostic **engineering-practices baseline** — one workspace-level file reached
 * by a lean pointer from the AGENTS.md hub (progressive disclosure). Target-agnostic (every target reads it via
 * the pointer); no per-stack or Copilot projection.
 */
export function generateEngineeringBaseline(cwd: string, config: Config): WriteResult {
  const body = renderTemplate("references/engineering-practices.md.eta", { ...config });
  return writeFile(resolve(cwd, "references/engineering-practices.md"), nl(body));
}
