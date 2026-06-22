import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Environment, Framework, Language } from "../config/schema.js";

export interface DetectedStack {
  languages: Language[];
  frameworks: Framework[];
  environments: Environment[];
  runtime?: string;
  /** Human-readable notes about what was detected, shown in the wizard. */
  notes: string[];
}

/** A parsed `package.json` shape — only the fields stack detection reads, all optional. */
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** Narrow untrusted parsed JSON to the subset of `package.json` we consume. */
function asPackageJson(value: unknown): PackageJson | null {
  return typeof value === "object" && value !== null ? (value as PackageJson) : null;
}

function depVersion(pkg: PackageJson, name: string): string | undefined {
  const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const raw = all[name];
  if (!raw) return undefined;
  const m = String(raw).match(/(\d+)(?:\.\d+)?/);
  return m ? m[1] : "latest";
}

/**
 * Inspect the target repo to pre-fill the wizard. Best-effort and non-destructive:
 * reads manifest files only. Currently covers the Node/TS ecosystem; more
 * ecosystems (go.mod, pyproject.toml, *.csproj) plug in here.
 */
export function detectStack(cwd: string): DetectedStack {
  const languages: Language[] = [];
  const frameworks: Framework[] = [];
  const environments: Environment[] = [];
  const notes: string[] = [];
  let runtime: string | undefined;

  const pkgPath = resolve(cwd, "package.json");
  const pkg = existsSync(pkgPath) ? asPackageJson(readJson(pkgPath)) : null;

  if (pkg) {
    notes.push("Found package.json (Node project).");
    runtime = pkg.engines?.node ? `node@${String(pkg.engines.node).replace(/[^\d.]/g, "")}` : "node";

    const tsVersion = depVersion(pkg, "typescript");
    const hasTsconfig = existsSync(resolve(cwd, "tsconfig.json"));
    if (tsVersion || hasTsconfig) {
      languages.push({ id: "typescript", version: tsVersion ?? "latest" });
      notes.push("Detected TypeScript.");
    } else {
      languages.push({ id: "javascript", version: "latest" });
    }

    const fwMap: Array<[string, string]> = [
      ["next", "nextjs"],
      ["react", "react"],
      ["vue", "vue"],
      ["@angular/core", "angular"],
      ["svelte", "svelte"],
      ["express", "express"],
      ["@nestjs/core", "nestjs"],
      ["fastify", "fastify"],
    ];
    for (const [dep, id] of fwMap) {
      const v = depVersion(pkg, dep);
      if (v) {
        frameworks.push({ id, version: v });
        notes.push(`Detected ${id} (from ${dep}).`);
      }
    }
  }

  const hasPython =
    existsSync(resolve(cwd, "pyproject.toml")) || existsSync(resolve(cwd, "requirements.txt"));
  if (existsSync(resolve(cwd, "go.mod"))) {
    languages.push({ id: "go", version: "latest" });
    notes.push("Found go.mod (Go project).");
  }
  if (hasPython) {
    languages.push({ id: "python", version: "latest" });
    notes.push("Found Python project manifest.");
  }

  // Environments
  if (existsSync(resolve(cwd, ".nvmrc"))) {
    environments.push({ id: "node-runtime", version: "latest" });
    notes.push("Found .nvmrc (Node version manager).");
  }
  if (
    existsSync(resolve(cwd, "Dockerfile")) ||
    existsSync(resolve(cwd, "docker-compose.yml")) ||
    existsSync(resolve(cwd, "compose.yaml"))
  ) {
    environments.push({ id: "docker", version: "latest" });
    notes.push("Found Docker setup.");
  }
  if (hasPython) {
    environments.push({ id: "python-venv", version: "latest" });
  }

  if (languages.length === 0) {
    notes.push("No known stack detected — you'll choose manually.");
  }

  return { languages, frameworks, environments, runtime, notes };
}
