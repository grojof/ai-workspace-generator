import type { Config } from "../config/schema.js";
import { renderTemplate } from "../render/engine.js";
import { docsPaths } from "./paths.js";
import { BLOCK_MANIFEST, resolveTemplate } from "./blockManifest.js";
import type { Block, BlockEntry } from "./blockManifest.js";

export type { Block } from "./blockManifest.js";

/** Walk a block manifest into ordered, rendered blocks. Pure function of `config` + `manifest`. */
export function composeFromManifest(config: Config, manifest: readonly BlockEntry[]): Block[] {
  // Resolve the docs layout once; templates that mention paths read `it.paths.*`.
  const data = { ...config, paths: docsPaths(config) };
  const blocks: Block[] = [];
  for (const entry of manifest) {
    if (entry.kind === "expand") {
      blocks.push(...entry.expand(config));
      continue;
    }
    if (entry.when && !entry.when(config)) continue;
    const content =
      entry.kind === "template"
        ? renderTemplate(resolveTemplate(entry.template, config), data)
        : entry.render(config);
    blocks.push({ id: entry.id, content });
  }
  return blocks;
}

/**
 * Compose the ordered managed blocks that make up AGENTS.md (and the Copilot mirror body) by walking
 * the declarative {@link BLOCK_MANIFEST}. The order and gating live in the manifest (data), not here —
 * see docs/development/changes/0008-extensible-architecture/design.md.
 */
export function composeBlocks(config: Config): Block[] {
  return composeFromManifest(config, BLOCK_MANIFEST);
}
