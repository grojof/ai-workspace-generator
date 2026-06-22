import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { renderTemplate, templateExists } from "../render/engine.js";
import { writeFile, type WriteResult } from "../render/writer.js";

/**
 * Stack detail as **references** (change 0017a). The per-stack layer body is generated once to a neutral
 * `references/stack/<id>.md`; AGENTS.md keeps only a pointer (see `stackPointer`); Copilot gets the same body
 * projected into a path-triggered `.github/instructions/<id>.instructions.md` where a file glob exists. One
 * source (`stackBody`) feeds every projection, so they cannot drift. Layer-0 governance never moves here.
 */

export type StackType = "language" | "framework" | "environment";
export interface StackItem {
  id: string;
  version: string;
}

const LAYER: Record<StackType, number> = { language: 1, framework: 2, environment: 3 };
const TEMPLATE_DIR: Record<StackType, string> = {
  language: "languages",
  framework: "frameworks",
  environment: "environments",
};

/** Path globs that make a stack entry path-triggerable (Copilot `applyTo`, etc.). `null` = no path trigger. */
const LANGUAGE_GLOB: Record<string, string> = {
  typescript: "**/*.ts,**/*.tsx",
  javascript: "**/*.js,**/*.jsx,**/*.mjs,**/*.cjs",
  python: "**/*.py",
  go: "**/*.go",
  java: "**/*.java",
  rust: "**/*.rs",
  csharp: "**/*.cs",
  ruby: "**/*.rb",
  php: "**/*.php",
};
const FRAMEWORK_GLOB: Record<string, string> = {
  react: "**/*.tsx,**/*.jsx",
  vue: "**/*.vue",
  svelte: "**/*.svelte",
};

export function stackGlob(type: StackType, id: string): string | null {
  if (type === "language") return LANGUAGE_GLOB[id] ?? null;
  if (type === "framework") return FRAMEWORK_GLOB[id] ?? null;
  return null; // environments aren't path-triggered
}

/** The full layer body for one stack entry — the single source. Uses the bundled template or a generic fallback. */
export function stackBody(config: Config, type: StackType, entry: StackItem): string {
  const path = `${TEMPLATE_DIR[type]}/${entry.id}/layer.md.eta`;
  if (templateExists(path)) return renderTemplate(path, { ...config, entry });
  const head =
    type === "environment"
      ? `## ${entry.id} (Layer 3 — environment) · ${entry.version}`
      : `## ${entry.id} (Layer ${LAYER[type]} — ${type}) · target v${entry.version}`;
  const body =
    type === "language"
      ? [
          "- Follow the ecosystem's standard formatter and linter; fail CI on violations.",
          "- Match existing code style and naming. Validate inputs at boundaries.",
        ]
      : type === "framework"
        ? ["- Follow the framework's idiomatic project structure and patterns."]
        : ["- Document the setup steps and gotchas for this environment in this block."];
  const ctx7 =
    type === "environment"
      ? `> No bundled module yet — query **context7** for \`${entry.id}\` setup and best practices.`
      : `> No bundled module yet — query **context7** for \`${entry.id}@${entry.version}\` best practices.`;
  return [head, "", ...body, "", ctx7].join("\n");
}

/** The compact AGENTS.md block content for a stack entry: a heading + a resolving pointer to the reference. */
export function stackPointer(type: StackType, entry: StackItem): string {
  const glob = stackGlob(type, entry.id);
  const head =
    type === "environment"
      ? `## ${entry.id} (Layer 3 — environment) · ${entry.version}`
      : `## ${entry.id} (Layer ${LAYER[type]} — ${type}) · target v${entry.version}`;
  const applies = glob ? ` (applies to \`${glob.split(",").join(", ")}\`)` : "";
  const rel = `references/stack/${entry.id}.md`;
  return `${head}\nRules → [${rel}](${rel})${applies}.`;
}

/** Ensure a trailing newline (generated files end with one). */
function nl(s: string): string {
  return s.endsWith("\n") ? s : `${s}\n`;
}

/** Emit `references/stack/<id>.md` for every active stack entry, plus the Copilot `applyTo` projection. */
export function generateStackReferences(
  cwd: string,
  config: Config,
  stack: { languages: StackItem[]; frameworks: StackItem[]; environments: StackItem[] },
): WriteResult[] {
  const out: WriteResult[] = [];
  const copilot = config.targets.includes("copilot");
  const groups: Array<[StackType, StackItem[]]> = [
    ["language", stack.languages],
    ["framework", stack.frameworks],
    ["environment", stack.environments],
  ];
  for (const [type, items] of groups) {
    for (const entry of items) {
      const body = stackBody(config, type, entry);
      out.push(writeFile(resolve(cwd, `references/stack/${entry.id}.md`), nl(body)));
      const glob = stackGlob(type, entry.id);
      if (copilot && glob) {
        const instr = ["---", `applyTo: "${glob}"`, "---", "", body].join("\n");
        out.push(writeFile(resolve(cwd, `.github/instructions/${entry.id}.instructions.md`), nl(instr)));
      }
    }
  }
  return out;
}
