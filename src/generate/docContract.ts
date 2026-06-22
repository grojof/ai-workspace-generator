import type { Config, DocEntry } from "../config/schema.js";
import { docsPaths } from "./paths.js";

/**
 * The documentation contract: the declared set of docs that must exist (0016a). When `config.docs.contract`
 * is set it wins; otherwise the built-in default below — derived from what the generator actually emits —
 * applies, so `doctor`'s dangling-reference and orphan checks work with zero config.
 */
export function resolveDocContract(config: Config): DocEntry[] {
  if (config.docs.contract && config.docs.contract.length > 0) return config.docs.contract;
  return defaultDocContract(config);
}

/** The docs the generator produces for any workspace — the baseline contract. */
function defaultDocContract(config: Config): DocEntry[] {
  const p = docsPaths(config);
  const entries: DocEntry[] = [
    // The root README is the entry point / index that links into docs/ — authored by the team, not generated.
    { path: "README.md", owner: "authored", description: "Project entry point and documentation index." },
    { path: "docs/README.md", owner: "generated", description: "Documentation layout overview." },
  ];
  if (config.livingDocs) {
    entries.push(
      { path: `${p.status}/PROJECT-STATE.md`, owner: "generated", description: "Living project snapshot." },
      { path: `${p.status}/ARCHITECTURE.md`, owner: "generated", description: "Architecture snapshot." },
    );
  }
  return entries;
}
