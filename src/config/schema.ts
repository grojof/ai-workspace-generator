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

/**
 * User profile — two orthogonal dimensions that drive governance posture. This is the *single*
 * place the BUSINESS/TECHNICAL × BEGINNER/STANDARD/ADVANCED model is defined; the wizard, the
 * `profile` AGENTS.md block and (later) skill routing all read from here. Changing either field and
 * re-running `sync` re-renders only the profile-driven blocks — idempotent.
 */
export const ProfileSchema = z.object({
  /** business = process/ops/docs-oriented; technical = dev/devops/data/infra-oriented. */
  userType: z.enum(["business", "technical"]).default("technical"),
  /** beginner = guided & strict; standard = balanced; advanced = analytical & high-autonomy. */
  experience: z.enum(["beginner", "standard", "advanced"]).default("standard"),
});

export const BusinessSchema = z.object({
  domain: z.string().optional(),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
  invariants: z.array(z.string()).default([]),
});

export const SddSchema = z.object({
  enabled: z.boolean().default(true),
  /**
   * Where SDD artifacts live. `files` = plain Markdown in the repo using the OpenSpec *folder layout*
   * (specs/ + changes/ + archive/) — a convention we borrow, NOT a dependency on the OpenSpec CLI.
   * `hybrid` = files + cross-session memory (engram) if available. `none` = inline only.
   */
  backend: z.enum(["files", "hybrid", "none"]).default("files"),
  /**
   * Spec depth mode. `lean` = the light Spec-Kit/OpenSpec flow (default, keep it simple). `reasons` =
   * the closed REASONS Canvas (8 sections + frontmatter, profiles A/B, validation) for auditable
   * enterprise apps — loaded on demand via the `sdd-spec-schema` skill, never inlined in AGENTS.md.
   */
  schema: z.enum(["lean", "reasons"]).default("lean"),
  /**
   * Methodology flow (orthogonal to `schema`, which is spec *depth*). `sdd` = spec-driven (default).
   * `spdd` = Structured-Prompt-Driven Development (Thoughtworks): the structured prompt — the REASONS
   * Canvas — is a first-class, version-controlled, maintained artifact. `spdd` **implies**
   * `schema: "reasons"` (the Canvas is its artifact); enforced by the ConfigSchema transform below.
   * SPDD reuses the `/sdd-*` command family and the `reasons` skills — it is not a fork.
   */
  methodology: z.enum(["sdd", "spdd"]).default("sdd"),
  /** REASONS app profile (only meaningful when schema === "reasons"). A = Python, B = HTML+JS. */
  appProfile: z.enum(["A", "B"]).nullable().default(null),
  /**
   * Seed a project `constitution.md` (project principles) at init. A bootstrap idea borrowed from
   * Spec-Kit; only meaningful for greenfield repos, so it is gated to `project.mode === "new"`.
   */
  constitution: z.boolean().default(true),
  vendorSkills: z.boolean().default(true),
});

/**
 * Documentation layout. Folder names are stable and English (predictable across repos and for tooling);
 * the *content* follows `config.language`. `development/` holds the SDD store + AI living status;
 * `project/` holds human project docs. Both are overridable; all generated references resolve from here.
 */
export const DocsSchema = z.object({
  /** Human project documentation root. Default `docs/project`. */
  project: z.string().optional(),
  /** Development process root (SDD specs/changes + AI status). Default `docs/development`. */
  development: z.string().optional(),
});

/**
 * Distribution identity for `ai-workspace package`. All optional with smart defaults derived from
 * `project.name`/`company`; set these to publish a **stable, canonical org plugin** (e.g.
 * `acme-ai-workspace`) that coexists with other org plugins in one private marketplace, instead of
 * deriving the name from the consuming repo. Names must be kebab-case (plugin/marketplace identifiers).
 */
export const DistributionSchema = z.object({
  /** Plugin id (kebab-case). Default: kebab(project.name). */
  plugin: z.string().optional(),
  /** Marketplace id (kebab-case). Default: `<company>-tools` or `<slug>-tools`. */
  marketplace: z.string().optional(),
  /** Plugin/marketplace owner shown in manifests. Default: org name or project.name. */
  owner: z.string().optional(),
  /**
   * Multi-repo distribution topology. `false` (default) = one **umbrella** plugin aggregating every repo.
   * `true` = one plugin **per child repo** (root workflow skills + that repo's stack skills), listed in a
   * multi-plugin marketplace. Only meaningful when `repos[]` is populated.
   */
  perRepo: z.boolean().default(false),
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

export const HooksSchema = z.object({
  /**
   * PreToolUse Bash guard that hardens the Safety gate deterministically (Claude Code only). Generates
   * `.claude/hooks/safety-guard.mjs`. `warn` = ask before risky commands (force-push, rm -rf, migrations…);
   * `block` = deny them; `off` = no hook. Opt-in (default off) so existing projects are never disrupted.
   */
  safetyGuard: z.enum(["warn", "block", "off"]).default("off"),
});

export const WorkflowSchema = z.object({
  commits: CommitsSchema.prefault({}),
  /** Require explicit user approval on conflicts, migrations, and version changes. */
  safetyGate: z.boolean().default(true),
  /** Make the structured development flow mandatory (the AI must not skip it). */
  enforceFlow: z.boolean().default(true),
  /** Optional Claude Code hooks that enforce governance at the harness layer (opt-in). */
  hooks: HooksSchema.prefault({}),
});

/**
 * A repo governed by a multi-repo workspace. `stack` overrides the root default; `path` is workspace-root
 * relative. An empty top-level `repos[]` means single-repo (this directory) — see `resolveRepos`.
 */
export const RepoSchema = z.object({
  path: z.string(),
  name: z.string().optional(),
  stack: StackSchema.optional(),
});

const BaseConfigSchema = z.object({
  version: z.literal(1).default(1),
  project: z.object({
    name: z.string(),
    description: z.string().default(""),
    /** new = greenfield (recommend current stable); existing = conservative versions. */
    mode: z.enum(["new", "existing"]).default("new"),
    /** build = ship software; learn = a tutoring workspace (exercises, explanations). */
    purpose: z.enum(["build", "learn"]).default("build"),
  }),
  /** Who the workspace is for + how much AI fluency they have. Drives governance posture. */
  profile: ProfileSchema.prefault({}),
  /**
   * Organization overlay (culture + working rules). `none` for personal/generic repos.
   * `example` is a placeholder org you can rename/extend — see `templates/company/` and docs/project/EXTENDING.md.
   */
  company: z.enum(["none", "example"]).default("none"),
  targets: z.array(z.enum(["claude", "copilot"])).default(["claude", "copilot"]),
  /** Language of generated, human-facing content (instructions, guides, docs). */
  language: z.enum(["es", "en"]).default("es"),
  stack: StackSchema.prefault({}),
  conventions: ConventionsSchema.prefault({}),
  business: BusinessSchema.prefault({}),
  sdd: SddSchema.prefault({}),
  /** Documentation layout (project/ + development/{specs,changes,status}). */
  docs: DocsSchema.prefault({}),
  ingest: IngestSchema.prefault({}),
  /** Distribution identity for `ai-workspace package` (stable org plugin name/owner). */
  distribution: DistributionSchema.prefault({}),
  /**
   * Optional multi-repo: a workspace governing >1 linked repo. Empty = single-repo (this directory).
   * Additive — existing single-repo configs are unaffected. Normalize with `resolveRepos`.
   */
  repos: z.array(RepoSchema).default([]),
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

/**
 * The validated config. A normalization pass enforces cross-field invariants in a single place (it runs
 * for every `parse`/`safeParse`, so the wizard, `loadConfig` and tests all get the same shape):
 * SPDD's artifact is the REASONS Canvas, so `methodology: "spdd"` implies `schema: "reasons"`.
 */
export const ConfigSchema = BaseConfigSchema.transform((config) => {
  if (config.sdd.methodology === "spdd" && config.sdd.schema !== "reasons") {
    config.sdd.schema = "reasons";
  }
  return config;
});

export type Config = z.infer<typeof ConfigSchema>;

/** A repo with its effective (resolved) stack — single- and multi-repo collapse to this one shape. */
export interface ResolvedRepo {
  path: string;
  name: string;
  stack: Config["stack"];
}

/**
 * Normalize single- and multi-repo configs to one shape. Empty `repos[]` → the workspace dir itself as a
 * single repo; otherwise each repo's effective stack is its own `stack` or the root default. Downstream
 * per-repo logic iterates this so both cases share one code path.
 */
export function resolveRepos(config: Config): ResolvedRepo[] {
  if (!config.repos.length) {
    return [{ path: ".", name: config.project.name, stack: config.stack }];
  }
  return config.repos.map((r) => ({ path: r.path, name: r.name ?? r.path, stack: r.stack ?? config.stack }));
}

/**
 * A config whose `stack` is the **union** of every resolved repo's effective stack (de-duped by `id`,
 * keeping the first occurrence). Workspace-level artifacts (root `AGENTS.md`, Copilot mirror, skill routing)
 * are composed over this so they document every stack present anywhere in the workspace. For a single repo
 * the union equals the root stack, so output is unchanged.
 */
export function unionStack(config: Config): Config {
  const languages: Config["stack"]["languages"] = [];
  const frameworks: Config["stack"]["frameworks"] = [];
  const environments: Config["stack"]["environments"] = [];
  const seen = { languages: new Set<string>(), frameworks: new Set<string>(), environments: new Set<string>() };
  const push = <T extends { id: string }>(into: T[], set: Set<string>, items: readonly T[]) => {
    for (const item of items) {
      if (set.has(item.id)) continue;
      set.add(item.id);
      into.push(item);
    }
  };
  for (const repo of resolveRepos(config)) {
    push(languages, seen.languages, repo.stack.languages);
    push(frameworks, seen.frameworks, repo.stack.frameworks);
    push(environments, seen.environments, repo.stack.environments);
  }
  return { ...config, stack: { ...config.stack, languages, frameworks, environments } };
}

export type Profile = z.infer<typeof ProfileSchema>;
export type Docs = z.infer<typeof DocsSchema>;
export type Distribution = z.infer<typeof DistributionSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
