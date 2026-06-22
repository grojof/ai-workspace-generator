/**
 * Stack skill packs (skills-as-data, 0003 — phase A+B). The generator ships a library of vendored skill
 * packs under `skill-packs/<id>/` (a substantive `SKILL.md` + `references/`, the BASE mirrored from
 * upstream, e.g. agent-skills MIT) plus a `pack.yaml` OVERLAY with routing/gating metadata. When a pack's
 * `stackBinding` matches the workspace's configured stack and the active profile is allowed, the whole pack
 * is copied into `.claude/skills/<id>/`. This is additive: it does not touch the TS-generated skills.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";
import type { Config } from "../config/schema.js";
import { writeFile, writeBinary, type WriteResult } from "../render/writer.js";
import { SKILLS, type SkillEntry, type SkillUserType } from "../modules/skills.js";
import { isReservedNamespace } from "./naming.js";
import { docsPaths } from "./paths.js";

/** Binary asset extensions copied byte-for-byte (templates, logos) — never utf8-normalized. `.drawio`/`.svg` are XML text. */
const BINARY_ASSET = /\.(png|jpe?g|gif|ico|pdf|zip|pptx|potx|ppsx|dotx|docx|xlsx|xltx|thmx|ttf|otf|woff2?)$/i;

/** Token map for `templated` packs: `{{paths.*}}` from docsPaths (used by the migrated sdd-* packs). */
function packTokens(config: Config): Record<string, string> {
  const s = docsPaths(config);
  return {
    "paths.project": s.project,
    "paths.development": s.development,
    "paths.specs": s.specs,
    "paths.changes": s.changes,
    "paths.archive": s.archive,
    "paths.status": s.status,
    "paths.readme": s.readme,
    "paths.constitution": s.constitution,
  };
}

/** Replace `{{key}}` placeholders with their token value; unknown keys are left untouched. */
function resolveTokens(content: string, tokens: Record<string, string>): string {
  return content.replace(/\{\{([\w.]+)\}\}/g, (m, key: string) => (key in tokens ? tokens[key]! : m));
}

/** `pack.yaml` schema — the routing/gating overlay our generator adds on top of a vendored base. */
const PackManifestSchema = z.object({
  id: z.string(),
  /** Repo-relative path to the vendored BASE (e.g. `vendor/agent-skills/skills/odoo-18.0`). Drives `skills sync` propagation. */
  base: z.string().optional(),
  /**
   * Companion subagents shipped to `.claude/agents/<name>.md` when this pack applies. Each entry is a
   * repo-relative vendor dir; `skills sync` refreshes `skill-packs/<id>/agents/<name>.md` from `<dir>/SKILL.md`.
   */
  agents: z.array(z.string()).default([]),
  stackBinding: z
    .object({
      environments: z.array(z.string()).default([]),
      languages: z.array(z.string()).default([]),
      frameworks: z.array(z.string()).default([]),
    })
    .prefault({}),
  profile: z
    .object({
      userType: z.array(z.enum(["business", "technical"])).default(["technical"]),
    })
    .prefault({}),
  /** Declarative feature/company gating (ANDed). Lets non-stack packs (sdd/company) live in the library too. */
  gating: z
    .object({
      sdd: z
        .object({
          enabled: z.boolean().optional(),
          vendorSkills: z.boolean().optional(),
          schema: z.enum(["lean", "reasons"]).optional(),
          methodology: z.enum(["sdd", "spdd"]).optional(),
        })
        .optional(),
      company: z.union([z.literal("any"), z.array(z.string())]).optional(),
    })
    .optional(),
  /**
   * How this pack's content relates to the base (ADR 0003 part C) — the auditable primitive `aiws-reconcile`
   * reads. `new` (default) = an independent skill; `extends` = augments the base catalog; `overrides:<aiws-id>`
   * = replaces/augments a named base skill. The `overrides` target must be a reserved `aiws-*` id (existence
   * against the live base set is checked at load by {@link assertRelationsResolve}).
   */
  relation: z
    .string()
    .default("new")
    .superRefine((val, ctx) => {
      if (val === "new" || val === "extends") return;
      const m = /^overrides:(.+)$/.exec(val);
      if (!m) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `relation must be "new", "extends", or "overrides:<aiws-id>" (got "${val}")` });
        return;
      }
      if (!isReservedNamespace(m[1])) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `relation "overrides:${m[1]}" must target a base aiws- id` });
      }
    }),
  /** Whether this pack contributes a `skill-routing` row. `false` when routing stays in the catalog (migration). */
  routing: z.boolean().default(true),
  /** Resolve `{{paths.*}}` tokens in the copied content (for migrated TS skills). Off for raw vendored packs. */
  templated: z.boolean().default(false),
  loadMode: z.enum(["always", "suggested", "on-demand", "advanced-only"]).default("on-demand"),
  license: z.string().optional(),
  attribution: z.string().optional(),
  trigger: z.object({ en: z.string(), es: z.string() }).optional(),
});

export type PackManifest = z.infer<typeof PackManifestSchema>;

/** Absolute path to the shipped `skill-packs/` library (works in dev `src/` and built `dist/`). */
export function skillPacksDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // here is <pkg>/src/generate or <pkg>/dist/generate -> skill-packs is two levels up.
  return resolve(here, "../../skill-packs");
}

export interface LoadedPack {
  manifest: PackManifest;
  dir: string;
}

/** A pack's relation to the base (ADR 0003 part C), parsed from the `relation` field. */
export interface PackRelation {
  kind: "new" | "extends" | "overrides";
  /** The overridden base id, only when `kind === "overrides"`. */
  target?: string;
}

/** Interpret a manifest's `relation` field (already format-validated by the schema). */
export function packRelation(manifest: PackManifest): PackRelation {
  if (manifest.relation === "extends") return { kind: "extends" };
  const m = /^overrides:(.+)$/.exec(manifest.relation);
  if (m) return { kind: "overrides", target: m[1] };
  return { kind: "new" };
}

/** The set of base skill ids a pack may legitimately `overrides:` — registry skills + bundled pack ids. */
function baseSkillIds(packs: LoadedPack[]): Set<string> {
  const ids = new Set<string>();
  for (const s of SKILLS) ids.add(s.id);
  for (const { manifest } of packs) ids.add(manifest.id);
  return ids;
}

/**
 * Reject any `overrides:<id>` whose target is not a real base skill. The orchestrator family is registered
 * as the `aiws-sdd-*` glob, so an `aiws-sdd-<x>` target resolves against it. Throws on a dangling override.
 */
export function assertRelationsResolve(packs: LoadedPack[]): void {
  const ids = baseSkillIds(packs);
  for (const { manifest } of packs) {
    const r = packRelation(manifest);
    if (r.kind !== "overrides" || !r.target) continue;
    const resolves = ids.has(r.target) || (ids.has("aiws-sdd-*") && r.target.startsWith("aiws-sdd-"));
    if (!resolves) {
      throw new Error(`pack "${manifest.id}": relation "overrides:${r.target}" names no base skill (not in the aiws- catalog).`);
    }
  }
}

/** Read every `<root>/<id>/pack.yaml` into validated manifests. `external` packs may not claim the reserved
 *  `aiws` namespace (impersonation guard, ADR 0003 Part E) — a base id from outside the base is rejected. */
function readPacksFrom(root: string, opts: { external: boolean }): LoadedPack[] {
  if (!existsSync(root)) return [];
  const packs: LoadedPack[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(root, entry.name, "pack.yaml");
    if (!existsSync(manifestPath)) continue;
    const manifest = PackManifestSchema.parse(parse(readFileSync(manifestPath, "utf8")));
    if (opts.external && isReservedNamespace(manifest.id)) {
      throw new Error(`company pack "${manifest.id}" uses the reserved \`aiws\` namespace — only the base may. Use a \`corp-<handle>-\` id.`);
    }
    packs.push({ manifest, dir: join(root, entry.name) });
  }
  return packs;
}

/** Read and validate every bundled `skill-packs/<id>/pack.yaml`. */
export function loadPacks(): LoadedPack[] {
  const packs = readPacksFrom(skillPacksDir(), { external: false });
  assertRelationsResolve(packs);
  return packs;
}

/** Where vendored company packs land in a consumer repo (committed; produced by `ai-workspace packs sync`). */
export function companyPacksDir(cwd: string): string {
  return resolve(cwd, ".ai-workspace/packs");
}

/** Read vendored company packs from `.ai-workspace/packs/` (external source → reserved-namespace guarded). */
export function loadCompanyPacks(cwd: string): LoadedPack[] {
  return readPacksFrom(companyPacksDir(cwd), { external: true });
}

/** Bundled base packs + the repo's vendored company packs, with overlay relations validated across the union. */
export function loadAllPacks(cwd: string): LoadedPack[] {
  const packs = [...readPacksFrom(skillPacksDir(), { external: false }), ...loadCompanyPacks(cwd)];
  assertRelationsResolve(packs);
  return packs;
}

/** Parse a raw `pack.yaml` object into a validated manifest (exposed for tests + external pack loading). */
export function parsePackManifest(raw: unknown): PackManifest {
  return PackManifestSchema.parse(raw);
}

/** Whether a pack's stack binding matches any enabled language/framework/environment in the config. */
export function packMatchesStack(manifest: PackManifest, config: Config): boolean {
  const ids = {
    environments: config.stack.environments.map((e) => e.id),
    languages: config.stack.languages.map((l) => l.id),
    frameworks: config.stack.frameworks.map((f) => f.id),
  };
  const b = manifest.stackBinding;
  return (
    b.environments.some((id) => ids.environments.includes(id)) ||
    b.languages.some((id) => ids.languages.includes(id)) ||
    b.frameworks.some((id) => ids.frameworks.includes(id))
  );
}

/** Whether a pack declares any stack binding (language/framework/environment). Drives the workspace/repo split. */
export function hasStackBinding(manifest: PackManifest): boolean {
  const b = manifest.stackBinding;
  return b.environments.length > 0 || b.languages.length > 0 || b.frameworks.length > 0;
}

/** Evaluate the declarative `gating` (ANDed). Missing gating = always true. */
function gatingHolds(manifest: PackManifest, config: Config): boolean {
  const g = manifest.gating;
  if (!g) return true;
  if (g.sdd) {
    if (g.sdd.enabled !== undefined && config.sdd.enabled !== g.sdd.enabled) return false;
    if (g.sdd.vendorSkills !== undefined && config.sdd.vendorSkills !== g.sdd.vendorSkills) return false;
    if (g.sdd.schema !== undefined && config.sdd.schema !== g.sdd.schema) return false;
    if (g.sdd.methodology !== undefined && config.sdd.methodology !== g.sdd.methodology) return false;
  }
  if (g.company) {
    if (g.company === "any") {
      if (config.company.id === "none") return false;
    } else if (!g.company.includes(config.company.id)) return false;
  }
  return true;
}

/**
 * Whether a pack applies to the active config: userType + stack binding (if any) + gating. Experience does
 * NOT gate access — a technical user reaches every pack regardless of level (it only tunes posture).
 */
function packApplies(manifest: PackManifest, config: Config): boolean {
  if (!manifest.profile.userType.includes(config.profile.userType)) return false;
  if (hasStackBinding(manifest) && !packMatchesStack(manifest, config)) return false;
  return gatingHolds(manifest, config);
}

/**
 * Whether the user's explicit `config.skills` selection includes this pack. An **empty** list means "no
 * explicit choice" → every available pack is included (the default, backward-compatible). A non-empty list
 * is an allow-list: only those pack ids are generated/routed.
 */
function packSelected(manifest: PackManifest, config: Config): boolean {
  // Only the user-choosable library (routing:true) is governed by the explicit list. Feature-bundle packs
  // (corp-*, sdd-* — routing:false) follow their own gating (company / SDD flags), never the list.
  if (!manifest.routing) return true;
  return config.skills.length === 0 || config.skills.includes(manifest.id);
}

/** One-line description for the wizard: the pack's routing trigger, else its SKILL.md frontmatter description. */
function frontmatterDescription(skillPath: string): string | undefined {
  if (!existsSync(skillPath)) return undefined;
  const fm = readFileSync(skillPath, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return undefined;
  const lines = fm[1]!.split("\n");
  const i = lines.findIndex((l) => /^description:/.test(l));
  if (i === -1) return undefined;
  const inline = lines[i]!.replace(/^description:\s*/, "").trim();
  if (inline && !/^[>|]-?$/.test(inline)) return inline;
  const body: string[] = [];
  for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]!); j++) body.push(lines[j]!.trim());
  return body.join(" ").trim() || undefined;
}

export interface AvailablePack {
  id: string;
  description: string;
}

/**
 * The packs that COULD apply to this config (pass profile + stack binding + gating) — the menu the `init`
 * wizard offers for explicit selection, each with a one-line description. Order is stable (by id).
 */
export function availablePacks(config: Config): AvailablePack[] {
  const out: AvailablePack[] = [];
  for (const { manifest, dir } of loadPacks()) {
    // Only the user-choosable library (routing:true). Feature bundles (corp-*/sdd-*) come with company/SDD.
    if (!manifest.routing || !packApplies(manifest, config)) continue;
    const desc = manifest.trigger?.[config.language] ?? manifest.trigger?.en ?? frontmatterDescription(join(dir, "SKILL.md")) ?? manifest.id;
    out.push({ id: manifest.id, description: desc.replace(/\s+/g, " ").trim() });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Routing entries for the packs that apply — so they appear in the `skill-routing` block, derived from each
 * pack's `pack.yaml` (not hardcoded). Packs with `routing: false` keep their routing in the catalog.
 */
export function stackPackSkillEntries(config: Config): SkillEntry[] {
  if (!config.targets.includes("claude")) return [];
  const entries: SkillEntry[] = [];
  for (const { manifest } of loadPacks()) {
    if (!manifest.routing || !packApplies(manifest, config) || !packSelected(manifest, config)) continue;
    const userType: SkillUserType = manifest.profile.userType.length === 1 ? manifest.profile.userType[0]! : "both";
    entries.push({
      id: manifest.id,
      domain: "development",
      level: "all",
      userType,
      loadMode: manifest.loadMode,
      risk: "low",
      enabled: () => true,
      trigger: manifest.trigger ?? { en: `working with the ${manifest.id} stack`, es: `trabajar con el stack ${manifest.id}` },
    });
  }
  return entries;
}

/** Append `content` to `skill` wrapped in a named managed block. */
function appendBlock(skill: string, id: string, content: string): string {
  return `${skill.trimEnd()}\n\n<!-- ai-workspace:begin:${id} -->\n${content.trim()}\n<!-- ai-workspace:end:${id} -->\n`;
}

/**
 * Layer pack overlays onto the base SKILL.md as managed blocks — keeping the upstream base and our additions
 * as separate files (sync updates the base; overlays are ours):
 *  - `overlay.md` — generic, ALWAYS applied (e.g. surfaces project conventions into the skill).
 *  - `overlay.<company>.md` — only when a matching `company` is selected.
 */
function applyOverlays(skill: string, dir: string, config: Config): string {
  let out = skill;
  const genericPath = join(dir, "overlay.md");
  if (existsSync(genericPath)) out = appendBlock(out, "pack-overlay", readFileSync(genericPath, "utf8"));
  if (config.company.id !== "none") {
    const overlayPath = join(dir, `overlay.${config.company.id}.md`);
    if (existsSync(overlayPath)) out = appendBlock(out, "company-overlay", readFileSync(overlayPath, "utf8"));
  }
  return out;
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

/**
 * Which packs a generation phase emits. "workspace" = packs with no stack binding (sdd/corp) at the
 * workspace root; "repo" = stack-bound packs per repo, gated by its effective stack; "all" = both
 * (single-dir generation; the default keeps any external caller working).
 */
export type PackScope = "all" | "workspace" | "repo";

/**
 * Copy every stack pack whose binding matches the config (and whose profile is allowed) into
 * `.claude/skills/<id>/`. Claude target only. Idempotent (managed writes report unchanged on re-run).
 * `scope` partitions packs for multi-repo generation: non-stack packs are workspace-level, stack-bound
 * packs are per-repo (see {@link PackScope}).
 */
export function generateStackPacks(cwd: string, config: Config, scope: PackScope = "all"): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.targets.includes("claude")) return results;

  const tokens = packTokens(config);
  // Bundled base packs + the repo's vendored company packs (.ai-workspace/packs/), guarded + relation-checked.
  for (const { manifest, dir } of loadAllPacks(cwd)) {
    if (!packApplies(manifest, config) || !packSelected(manifest, config)) continue;
    if (scope === "workspace" && hasStackBinding(manifest)) continue;
    if (scope === "repo" && !hasStackBinding(manifest)) continue;
    for (const file of listFiles(dir)) {
      const name = basename(file);
      if (name === "pack.yaml") continue; // routing/gating metadata — not shipped to the workspace
      if (name.startsWith("overlay.")) continue; // overlays — merged into SKILL.md below, not copied
      const rel = relative(dir, file).split(/[\\/]/).join("/");
      // Companion subagents DECLARED in pack.yaml (`agents:`) ship to `.claude/agents/`. A pack that merely
      // bundles an internal `agents/` dir (e.g. skill-creator) keeps it under the skill dir, untouched.
      if (manifest.agents.length > 0 && rel.startsWith("agents/")) {
        results.push(writeFile(resolve(cwd, ".claude/agents", name), readFileSync(file, "utf8")));
        continue;
      }
      const dest = resolve(cwd, ".claude/skills", manifest.id, rel);
      // Binary assets (templates, logos) must be copied byte-for-byte, never utf8-normalized.
      if (BINARY_ASSET.test(name)) {
        results.push(writeBinary(dest, file));
        continue;
      }
      let content = readFileSync(file, "utf8");
      if (name === "SKILL.md") content = applyOverlays(content, dir, config);
      if (manifest.templated) content = resolveTokens(content, tokens);
      results.push(writeFile(dest, content));
    }
  }
  return results;
}
