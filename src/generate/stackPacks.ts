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
import type { SkillEntry, SkillUserType } from "../modules/skills.js";
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
      company: z.union([z.literal("any"), z.array(z.enum(["example"]))]).optional(),
    })
    .optional(),
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

/** Read and validate every `skill-packs/<id>/pack.yaml`. */
export function loadPacks(): LoadedPack[] {
  const root = skillPacksDir();
  if (!existsSync(root)) return [];
  const packs: LoadedPack[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(root, entry.name, "pack.yaml");
    if (!existsSync(manifestPath)) continue;
    const manifest = PackManifestSchema.parse(parse(readFileSync(manifestPath, "utf8")));
    packs.push({ manifest, dir: join(root, entry.name) });
  }
  return packs;
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
      if (config.company === "none") return false;
    } else if (!g.company.includes(config.company as "example")) return false;
  }
  return true;
}

/**
 * Whether a pack applies to the active config: userType + stack binding (if any) + gating. Experience does
 * NOT gate access — a technical user reaches every pack regardless of level (it only tunes posture).
 */
function packApplies(manifest: PackManifest, config: Config): boolean {
  if (!manifest.profile.userType.includes(config.profile.userType)) return false;
  const b = manifest.stackBinding;
  const hasBinding = b.environments.length > 0 || b.languages.length > 0 || b.frameworks.length > 0;
  if (hasBinding && !packMatchesStack(manifest, config)) return false;
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
  if (config.company !== "none") {
    const overlayPath = join(dir, `overlay.${config.company}.md`);
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
 * Copy every stack pack whose binding matches the config (and whose profile is allowed) into
 * `.claude/skills/<id>/`. Claude target only. Idempotent (managed writes report unchanged on re-run).
 */
export function generateStackPacks(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.targets.includes("claude")) return results;

  const tokens = packTokens(config);
  for (const { manifest, dir } of loadPacks()) {
    if (!packApplies(manifest, config) || !packSelected(manifest, config)) continue;
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
