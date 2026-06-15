import { z } from "zod";

/**
 * Schema for `workspace.config.yaml`. This is the single source of inputs for
 * rendering every artifact. It also drives the wizard and `doctor` validation.
 */

export const LanguageSchema = z.object({
  id: z.string(),
  version: z.string().default("latest"),
});

export const FrameworkSchema = z.object({
  id: z.string(),
  version: z.string().default("latest"),
});

export const EnvironmentSchema = z.object({
  id: z.string(),
  version: z.string().default("latest"),
});

export const StackSchema = z.object({
  languages: z.array(LanguageSchema).default([]),
  frameworks: z.array(FrameworkSchema).default([]),
  /** Tooling/runtime environments: wsl, docker, node-runtime (nvm), python-venv, postgres… */
  environments: z.array(EnvironmentSchema).default([]),
  runtime: z.string().optional(),
});

export const ConventionsSchema = z.object({
  prefixes: z.record(z.string(), z.string()).default({}),
  fileNaming: z
    .enum(["kebab-case", "camelCase", "PascalCase", "snake_case"])
    .default("kebab-case"),
  banned: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

export const BusinessSchema = z.object({
  domain: z.string().optional(),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
  invariants: z.array(z.string()).default([]),
});

export const SddSchema = z.object({
  enabled: z.boolean().default(true),
  /**
   * Where SDD artifacts live. `openspec` uses the OpenSpec *folder layout* (specs/ + changes/
   * + archive/) — a convention we borrow, NOT a dependency on the OpenSpec CLI.
   */
  backend: z.enum(["openspec", "hybrid", "none"]).default("openspec"),
  /**
   * Seed a project `constitution.md` (project principles) at init. A bootstrap idea borrowed from
   * Spec-Kit; only meaningful for greenfield repos, so it is gated to `project.mode === "new"`.
   */
  constitution: z.boolean().default(true),
  vendorSkills: z.boolean().default(true),
});

export const IngestSchema = z.object({
  sources: z.array(z.string()).default([]),
  reconcileWithContext7: z.boolean().default(true),
  preferCompanyOnConflict: z.boolean().default(true),
});

export const ScopeSchema = z.object({
  ignore: z.array(z.string()).default(["dist", "build", "node_modules", "**/*.min.js"]),
  gitignoreManaged: z.array(z.string()).default([".claude/settings.local.json"]),
  include: z.array(z.string()).default([]),
});

export const TokenBudgetSchema = z.object({
  agentsMd: z.number().default(4000),
  perInstruction: z.number().default(1500),
});

export const CommitsSchema = z.object({
  conventional: z.boolean().default(true),
  /** Add Co-Authored-By / AI attribution trailers. Off: commits are the user's own. */
  coAuthor: z.boolean().default(false),
  /** How the AI commits code: only after explicit approval, or never (manual). */
  automate: z.enum(["with-approval", "manual"]).default("with-approval"),
  /** Install a commit-msg git hook that enforces the commit policy. */
  gitHook: z.boolean().default(true),
});

export const WorkflowSchema = z.object({
  commits: CommitsSchema.prefault({}),
  /** Require explicit user approval on conflicts, migrations, and version changes. */
  safetyGate: z.boolean().default(true),
  /** Make the structured development flow mandatory (the AI must not skip it). */
  enforceFlow: z.boolean().default(true),
});

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  project: z.object({
    name: z.string(),
    description: z.string().default(""),
    /** new = greenfield (recommend current stable); existing = conservative versions. */
    mode: z.enum(["new", "existing"]).default("new"),
    /** build = ship software; learn = a tutoring workspace (exercises, explanations). */
    purpose: z.enum(["build", "learn"]).default("build"),
  }),
  targets: z.array(z.enum(["claude", "copilot"])).default(["claude", "copilot"]),
  /** Language of generated, human-facing content (instructions, guides, docs). */
  language: z.enum(["es", "en"]).default("es"),
  stack: StackSchema.prefault({}),
  conventions: ConventionsSchema.prefault({}),
  business: BusinessSchema.prefault({}),
  sdd: SddSchema.prefault({}),
  ingest: IngestSchema.prefault({}),
  scope: ScopeSchema.prefault({}),
  mcp: z.array(z.string()).default(["context7"]),
  skills: z.array(z.string()).default([]),
  livingDocs: z.boolean().default(true),
  workflow: WorkflowSchema.prefault({}),
  /** When true, add a Claude Stop hook that reminds to run /doc-sync. */
  livingDocsHook: z.boolean().default(false),
  tokenBudget: TokenBudgetSchema.prefault({}),
  /** Template generation that produced the current artifacts. Used by `upgrade`. */
  templatesVersion: z.string().default("0.0.0"),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
