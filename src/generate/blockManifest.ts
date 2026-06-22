import type { Config } from "../config/schema.js";
import { templateExists } from "../render/engine.js";
import { renderSkillRouting } from "./skillRouting.js";
import { stackPointer } from "./references.js";

/** A managed block of AGENTS.md (and the Copilot mirror body): a stable id + its rendered content. */
export interface Block {
  id: string;
  content: string;
}

type Gate = (config: Config) => boolean;

/**
 * Declarative description of the ordered blocks that make up AGENTS.md. The array order **is** the
 * contract pinned by `test/invariants.test.js`; adding a block is a new entry here, not surgery in
 * `composeBlocks`. Three producer kinds cover everything the imperative version did:
 *  - `template` — a single `.eta` block, optionally gated by `when`.
 *  - `render`   — content from a render function (e.g. skill-routing), optionally gated.
 *  - `expand`   — zero-or-more blocks derived from a config array (the per-stack layers).
 * See docs/development/changes/0008-extensible-architecture/design.md.
 */
export type BlockEntry =
  | { kind: "template"; id: string; template: string; when?: Gate }
  | { kind: "render"; id: string; render: (config: Config) => string; when?: Gate }
  | { kind: "expand"; expand: (config: Config) => Block[] };

/** Resolve a template path, substituting `{company}` for the selected organization. */
export function resolveTemplate(template: string, config: Config): string {
  return template.replace("{company}", config.company.id);
}

export const BLOCK_MANIFEST: readonly BlockEntry[] = [
  { kind: "template", id: "header", template: "core/header.md.eta" },
  { kind: "template", id: "core", template: "core/conventions.md.eta" },
  // Profile posture: renders ONLY the active userType×experience combination (token-cheap).
  { kind: "template", id: "profile", template: "profile/posture.md.eta" },
  { kind: "template", id: "versioning", template: "core/versioning.md.eta" },
  { kind: "template", id: "safety", template: "core/safety.md.eta" },
  { kind: "template", id: "workflow", template: "core/workflow.md.eta" },
  // Harness-engineering stance + the ratchet principle (how the instruction set may grow). Always on.
  { kind: "template", id: "harness-engineering", template: "core/harness-engineering.md.eta" },
  { kind: "template", id: "routing", template: "core/routing.md.eta" },
  // Skill routing: which skills to surface for the active profile (derived from the skill registry).
  { kind: "render", id: "skill-routing", render: (config) => renderSkillRouting(config) },
  // Greenfield only: how to choose the stack + production target before any per-stack layers exist. Gated to
  // new projects with no language/framework yet, so configured/existing repos aren't nagged. Sits after
  // skill-routing (keeps the fixed Layer-0 prefix) and where the stack layers would otherwise begin.
  {
    kind: "template",
    id: "tech-selection",
    template: "core/tech-selection.md.eta",
    when: (c) =>
      c.project.mode === "new" && c.stack.languages.length === 0 && c.stack.frameworks.length === 0,
  },
  // Layers 1-3: one block per stack entry. The body lives in `references/stack/<id>.md` (0017a); the block
  // keeps only a resolving pointer. Block ids are unchanged (no migration); `generateStackReferences` writes
  // the referenced bodies + the Copilot `applyTo` projection.
  {
    kind: "expand",
    expand: (config) =>
      config.stack.languages.map((l) => ({ id: `lang-${l.id}`, content: stackPointer("language", l) })),
  },
  {
    kind: "expand",
    expand: (config) =>
      config.stack.frameworks.map((f) => ({ id: `fw-${f.id}`, content: stackPointer("framework", f) })),
  },
  {
    kind: "expand",
    expand: (config) =>
      config.stack.environments.map((e) => ({ id: `env-${e.id}`, content: stackPointer("environment", e) })),
  },
  {
    kind: "template",
    id: "learning",
    template: "core/learning.md.eta",
    when: (c) => c.project.purpose === "learn",
  },
  // Organization overlay (culture + working rules), English-only (AI-facing); only when a company is set.
  {
    kind: "template",
    id: "company-overlay",
    template: "company/{company}/overlay.md.eta",
    when: (c) => c.company.id !== "none" && templateExists(`company/${c.company.id}/overlay.md.eta`),
  },
  { kind: "template", id: "company", template: "company/overlay.md.eta" },
  { kind: "template", id: "business", template: "business/domain.md.eta" },
  { kind: "template", id: "sdd", template: "sdd/orchestrator.md.eta", when: (c) => c.sdd.enabled },
  { kind: "template", id: "living-docs", template: "living-docs/section.md.eta", when: (c) => c.livingDocs },
];
