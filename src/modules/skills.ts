import type { Config } from "../config/schema.js";

/**
 * Catalog of skills the generator knows about, with the metadata that drives **routing**: which skills
 * to surface for a given user profile, project and tools. This is the single place to classify skills;
 * the `skill-routing` block in AGENTS.md is derived from here, filtered by the active profile.
 *
 * Skill *content* still lives in the generators (governance/sdd/skills/guides/learning) and is loaded by
 * the AI on its trigger — this registry only decides what to suggest, when, and to whom.
 */

export type SkillDomain =
  | "core"
  | "business"
  | "technical"
  | "project-management"
  | "development"
  | "devops"
  | "data"
  | "documentation"
  | "security"
  | "testing"
  | "onboarding";

export type SkillLevel = "beginner" | "standard" | "advanced" | "all";
export type SkillUserType = "business" | "technical" | "both";
export type SkillLoadMode = "always" | "suggested" | "on-demand" | "advanced-only";
export type SkillRisk = "low" | "medium" | "high";

export interface SkillEntry {
  id: string;
  domain: SkillDomain;
  /** Recommended experience level. `all` = relevant at any level. */
  level: SkillLevel;
  /** Recommended user type. `both` = relevant to business and technical. */
  userType: SkillUserType;
  /** How the AI should treat it: always-on, suggested, on-demand, or advanced-only. */
  loadMode: SkillLoadMode;
  risk: SkillRisk;
  /** Whether this skill is actually generated for the given config. */
  enabled: (config: Config) => boolean;
  /** Short, localized "use it when…" note for the routing table. */
  trigger: { en: string; es: string };
}

const claude = (c: Config) => c.targets.includes("claude");

export const SKILLS: SkillEntry[] = [
  {
    id: "secure-commit",
    domain: "core",
    level: "all",
    userType: "both",
    loadMode: "always",
    risk: "medium",
    enabled: claude,
    trigger: { en: "committing changes", es: "al hacer commit" },
  },
  {
    id: "dependency-upgrade",
    domain: "technical",
    level: "standard",
    userType: "technical",
    loadMode: "on-demand",
    risk: "high",
    enabled: claude,
    trigger: {
      en: "before any version bump or migration (assess first)",
      es: "antes de subir versiones o migrar (evalúa primero)",
    },
  },
  {
    id: "sdd-*",
    domain: "development",
    level: "all",
    userType: "both",
    loadMode: "suggested",
    risk: "low",
    enabled: (c) => c.sdd.enabled,
    trigger: {
      en: "planning/implementing a non-trivial change",
      es: "planificar/implementar un cambio no trivial",
    },
  },
  {
    id: "sdd-onboarding",
    domain: "onboarding",
    level: "all",
    userType: "technical",
    loadMode: "on-demand",
    risk: "low",
    enabled: (c) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: {
      en: "starting a new app / choosing profile A or B",
      es: "empezar una app nueva / elegir perfil A o B",
    },
  },
  {
    id: "sdd-spec-schema",
    domain: "development",
    level: "all",
    userType: "technical",
    loadMode: "on-demand",
    risk: "low",
    enabled: (c) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: {
      en: "authoring/validating a spec in REASONS mode",
      es: "redactar/validar una spec en modo REASONS",
    },
  },
  ...(["sdd-audit-security", "sdd-audit-style", "sdd-audit-stack", "sdd-audit-architecture"].map((id) => ({
    id,
    domain: (id.endsWith("security") ? "security" : "technical") as SkillDomain,
    level: "advanced" as SkillLevel,
    userType: "technical" as SkillUserType,
    loadMode: "advanced-only" as SkillLoadMode,
    risk: "low" as SkillRisk,
    enabled: (c: Config) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: { en: `${id.replace("sdd-audit-", "")} audit of a REASONS spec/app`, es: `auditoría de ${id.replace("sdd-audit-", "")} de una spec/app REASONS` },
  }))),
  // Builder workflow (author side) — idea → spec → code → tests → handoff. REASONS mode only.
  ...([
    { id: "sdd-init", en: "scaffolding a new app's layout", es: "crear el layout de una app nueva" },
    { id: "sdd-spec-capture", en: "capturing requirements as a REASONS spec", es: "capturar requisitos como spec REASONS" },
    { id: "sdd-spec-review", en: "revising a spec / signing it off (status lifecycle)", es: "revisar una spec / firmarla (ciclo de estado)" },
    { id: "sdd-code-generation", en: "generating code from a signed-off spec", es: "generar código desde una spec aprobada" },
    { id: "sdd-code-maintenance", en: "propagating a spec change into code", es: "propagar un cambio de spec al código" },
    { id: "sdd-test-generation", en: "generating tests from the spec's §5", es: "generar tests desde la §5 de la spec" },
    { id: "sdd-self-review", en: "validating before IT handoff", es: "validar antes del handoff a IT" },
    { id: "sdd-handoff", en: "packaging the app for IT review", es: "empaquetar la app para revisión de IT" },
  ].map(({ id, en, es }) => ({
    id,
    domain: "development" as SkillDomain,
    level: "standard" as SkillLevel,
    userType: "technical" as SkillUserType,
    loadMode: "suggested" as SkillLoadMode,
    risk: "low" as SkillRisk,
    enabled: (c: Config) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: { en, es },
  }))),
  {
    // SPDD closed loop (code→prompt) — fold non-behavioural code changes back into the Canvas. SPDD only.
    id: "sdd-spec-sync",
    domain: "development",
    level: "standard",
    userType: "technical",
    loadMode: "suggested",
    risk: "low",
    enabled: (c) => c.sdd.enabled && c.sdd.methodology === "spdd" && claude(c),
    trigger: {
      en: "syncing non-behavioural code changes back into the REASONS Canvas (SPDD)",
      es: "sincronizar cambios de código no-conductuales al REASONS Canvas (SPDD)",
    },
  },
  {
    // Reviewer-side recovery — produce a draft spec from existing code (advanced/IT).
    id: "sdd-reverse-engineering",
    domain: "development",
    level: "advanced",
    userType: "technical",
    loadMode: "advanced-only",
    risk: "low",
    enabled: (c) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: {
      en: "recovering a spec from code that lacks one",
      es: "recuperar una spec desde código sin ella",
    },
  },
  {
    // One-off migration of a legacy non-Git SDD workspace (versioned by `_vN` filenames) to this model.
    id: "sdd-migrate",
    domain: "development",
    level: "advanced",
    userType: "technical",
    loadMode: "advanced-only",
    risk: "medium",
    enabled: (c) => c.sdd.enabled && c.sdd.schema === "reasons" && claude(c),
    trigger: {
      en: "adopting this generator on a legacy non-Git SDD repo",
      es: "adoptar este generador en un repo SDD legacy sin Git",
    },
  },
  // Company business-content skills are an optional extension point: bundle your own `corp-*` packs
  // under `skill-packs/` gated by `company` (see docs/project/EXTENDING.md). None ship in this public repo.
  {
    id: "living-docs",
    domain: "documentation",
    level: "all",
    userType: "both",
    loadMode: "suggested",
    risk: "low",
    enabled: (c) => c.livingDocs && claude(c),
    trigger: {
      en: "after finishing a task or when project state changed",
      es: "al terminar una tarea o cuando cambie el estado",
    },
  },
  {
    id: "ai-workspace-guide",
    domain: "onboarding",
    level: "beginner",
    userType: "both",
    loadMode: "suggested",
    risk: "low",
    enabled: claude,
    trigger: {
      en: "new here — how this workspace works",
      es: "si empiezas — cómo funciona este workspace",
    },
  },
  {
    id: "configure-workspace",
    domain: "onboarding",
    level: "all",
    userType: "both",
    loadMode: "suggested",
    risk: "low",
    enabled: claude,
    trigger: {
      en: "configuring or re-configuring the workspace (analyze an existing repo, or set up a new one)",
      es: "configurar o reconfigurar el workspace (analizar un repo existente, o preparar uno nuevo)",
    },
  },
  {
    id: "vscode-setup",
    domain: "onboarding",
    level: "beginner",
    userType: "both",
    loadMode: "on-demand",
    risk: "low",
    enabled: claude,
    trigger: { en: "setting up VS Code / extensions", es: "configurar VS Code / extensiones" },
  },
  {
    id: "learn",
    domain: "onboarding",
    level: "all",
    userType: "both",
    loadMode: "suggested",
    risk: "low",
    enabled: (c) => c.project.purpose === "learn" && claude(c),
    trigger: { en: "learning a topic with exercises", es: "aprender un tema con ejercicios" },
  },
];

/**
 * Select the skills to surface for the active config + profile. A skill is included when it is generated
 * (`enabled`) and its `userType` matches the profile (or is `both`). Experience does NOT gate availability:
 * a technical user reaches every skill regardless of level — experience only tunes *posture* (how much
 * guidance), and `advanced-only` is a presentation hint (it renders as "advanced" in the load column).
 * Order is by load mode so always-on skills come first.
 */
export function selectSkills(config: Config): SkillEntry[] {
  const { userType } = config.profile;
  const order: Record<SkillLoadMode, number> = { always: 0, suggested: 1, "on-demand": 2, "advanced-only": 3 };
  return SKILLS.filter((s) => {
    if (!s.enabled(config)) return false;
    if (s.userType !== "both" && s.userType !== userType) return false;
    return true;
  }).sort((a, b) => order[a.loadMode] - order[b.loadMode]);
}
