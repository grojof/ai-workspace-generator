import type { Config } from "../config/schema.js";
import { normalizeConfig } from "../config/loader.js";
import { TEMPLATES_VERSION } from "../version.js";
import type { DetectedStack } from "../detect/stack.js";

/**
 * The decisions a wizard run collects, independent of HOW they were collected (Simple defaults, the
 * Advanced prompt sequence, or `--yes`). `buildConfig` turns these + the detected stack into a normalized
 * Config — the single, testable assembly shared by every path. (Library `skills` are selected after the
 * config exists, so they are set by the caller, not here.)
 */
export interface WizardInputs {
  name: string;
  description: string;
  language: "es" | "en";
  mode: "new" | "existing";
  purpose: "build" | "learn";
  userType: "business" | "technical";
  experience: "beginner" | "standard" | "advanced";
  company: "none" | "example";
  targets: ("claude" | "copilot" | "codex")[];
  /** Generate `.vscode/` recommendations (off for Visual Studio / non-VS-Code users). */
  vscode: boolean;
  langIds: string[];
  fwIds: string[];
  envIds: string[];
  sddEnabled: boolean;
  sddBackend: "files" | "hybrid" | "none";
  sddMethodology: "sdd" | "spdd";
  livingDocs: boolean;
  useContext7: boolean;
  safetyGuard: "warn" | "block" | "off";
  from?: string[];
}

const versionOf = (id: string, list: { id: string; version: string }[]) =>
  list.find((x) => x.id === id)?.version ?? "latest";

/** Assemble + normalize the Config from collected inputs. Pure: no prompts, no I/O. */
export function buildConfig(inputs: WizardInputs, detected: DetectedStack): Config {
  return normalizeConfig({
    version: 1,
    project: {
      name: inputs.name.trim(),
      description: inputs.description.trim(),
      mode: inputs.mode,
      purpose: inputs.purpose,
    },
    profile: { userType: inputs.userType, experience: inputs.experience },
    company: inputs.company,
    targets: inputs.targets,
    vscode: inputs.vscode,
    language: inputs.language,
    stack: {
      languages: inputs.langIds.map((id) => ({ id, version: versionOf(id, detected.languages) })),
      frameworks: inputs.fwIds.map((id) => ({ id, version: versionOf(id, detected.frameworks) })),
      environments: inputs.envIds.map((id) => ({ id, version: versionOf(id, detected.environments) })),
      runtime: detected.runtime,
    },
    sdd: {
      enabled: inputs.sddEnabled,
      backend: inputs.sddBackend,
      // Constitution is a greenfield bootstrap; only seed it for new projects.
      constitution: inputs.mode === "new",
      vendorSkills: true,
      methodology: inputs.sddMethodology,
      // Org overlay gets the stricter REASONS schema by default; others stay lean. (SPDD forces reasons.)
      schema: inputs.company === "none" ? "lean" : "reasons",
    },
    livingDocs: inputs.livingDocs,
    workflow: { hooks: { safetyGuard: inputs.safetyGuard } },
    mcp: inputs.useContext7 ? ["context7"] : [],
    ingest: { sources: inputs.from ?? [], reconcileWithContext7: true, preferCompanyOnConflict: true },
    templatesVersion: TEMPLATES_VERSION,
  });
}

/**
 * The basics the Simple path collects interactively; everything else is a documented default. The governance
 * profile (`userType`, `experience`) is an explicit choice — detection seeds the stack, never the profile.
 */
export interface SimpleBasics {
  name: string;
  description?: string;
  language: "es" | "en";
  targets: ("claude" | "copilot" | "codex")[];
  userType: "business" | "technical";
  experience: "beginner" | "standard" | "advanced";
  from?: string[];
}

/**
 * Simple-mode inputs: accept the detected stack and apply best-practice defaults. A detected stack implies an
 * existing *project* (vs new); the governance profile comes from `basics`, never inferred from detection.
 */
export function simpleDefaults(detected: DetectedStack, basics: SimpleBasics): WizardInputs {
  const detectedExisting = detected.languages.length > 0 || detected.frameworks.length > 0;
  const mode: "new" | "existing" = detectedExisting ? "existing" : "new";
  return {
    name: basics.name,
    description: basics.description ?? "",
    language: basics.language,
    mode,
    purpose: "build",
    userType: basics.userType,
    experience: basics.experience,
    company: "none",
    targets: basics.targets,
    vscode: true,
    langIds: detected.languages.map((l) => l.id),
    fwIds: detected.frameworks.map((f) => f.id),
    envIds: detected.environments.map((e) => e.id),
    sddEnabled: true,
    sddBackend: "files",
    sddMethodology: "sdd",
    livingDocs: true,
    useContext7: true,
    safetyGuard: mode === "new" ? "warn" : "off",
    from: basics.from,
  };
}
