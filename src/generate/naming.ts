import { TEMPLATES_VERSION } from "../version.js";

/**
 * The reserved namespace for everything this generator owns (ADR 0003). Skills/commands are `aiws-*`;
 * managed block ids are `aiws:*`. Org overlays use `corp-<handle>-*` / `corp-<handle>:*`. External packs may
 * NOT use the `aiws` namespace — `isReservedNamespace` guards against impersonation.
 */
export const AIWS = "aiws";

/** Prefix a logical id with the base namespace: `secure-commit` → `aiws-secure-commit`. */
export function aiwsId(id: string): string {
  return id.startsWith(`${AIWS}-`) ? id : `${AIWS}-${id}`;
}

/** Whether an id sits in the reserved base namespace (used to reject impersonating external packs/blocks). */
export function isReservedNamespace(id: string): boolean {
  return id === AIWS || id.startsWith(`${AIWS}-`) || id.startsWith(`${AIWS}:`);
}

/**
 * YAML frontmatter for a generated skill, with provenance (ADR 0003). `source: aiws@<TEMPLATES_VERSION>`
 * records who owns the artifact and at which template version, so `aiws-reconcile`/`aiws-verify` can audit it.
 */
export function skillFrontmatter(name: string, description: string): string {
  return [
    "---",
    `name: ${name}`,
    "description: >",
    `  ${description}`,
    "license: Apache-2.0",
    "metadata:",
    "  author: ai-workspace",
    `  source: ${AIWS}@${TEMPLATES_VERSION}`,
    '  version: "1.0"',
    "---",
    "",
  ].join("\n");
}
