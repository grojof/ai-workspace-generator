import type { Config } from "../config/schema.js";

/**
 * Resolves the documentation layout. Folder names are **stable and English** so paths are predictable
 * across every generated repo and for tooling/AI — the *content* of these files follows
 * `config.language`. This is the single place that knows the layout; every generator and template
 * derives paths from here, so literal folder paths are never hardcoded elsewhere.
 *
 * Layout:
 *   <project>/                 human project documentation
 *   <development>/             development process
 *     specs/                   stable specifications (current truth)
 *     changes/<name>/          in-flight SDD changes
 *     changes/archive/         completed changes
 *     status/                  AI living docs (project state + architecture snapshot)
 */
export interface DocsPaths {
  /** Human project documentation root. */
  project: string;
  /** Development process root. */
  development: string;
  /** Stable specifications (current truth). */
  specs: string;
  /** In-flight changes. */
  changes: string;
  /** Completed changes. */
  archive: string;
  /** AI living docs (project state + architecture snapshot). */
  status: string;
  /** Development readme/index file. */
  readme: string;
  /** Greenfield principles file (stable, cross-platform-safe name). */
  constitution: string;
}

export function docsPaths(config: Config): DocsPaths {
  const project = config.docs.project?.trim() || "docs/project";
  const development = config.docs.development?.trim() || "docs/development";
  const changes = `${development}/changes`;
  return {
    project,
    development,
    specs: `${development}/specs`,
    changes,
    archive: `${changes}/archive`,
    status: `${development}/status`,
    readme: `${development}/README.md`,
    constitution: `${development}/constitution.md`,
  };
}
