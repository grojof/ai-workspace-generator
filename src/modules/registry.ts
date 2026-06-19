/**
 * Catalog of modules the generator knows how to wire up. This is the single
 * place to extend coverage; `init`, `add` and `doctor` all read from here.
 */

export interface ModuleEntry {
  id: string;
  label: string;
  /** True when a dedicated template fragment exists; otherwise a generic block is emitted. */
  bundled?: boolean;
}

export const LANGUAGES: ModuleEntry[] = [
  { id: "typescript", label: "TypeScript", bundled: true },
  { id: "javascript", label: "JavaScript" },
  { id: "go", label: "Go", bundled: true },
  { id: "python", label: "Python", bundled: true },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
];

export const FRAMEWORKS: ModuleEntry[] = [
  { id: "react", label: "React", bundled: true },
  { id: "nextjs", label: "Next.js", bundled: true },
  { id: "vue", label: "Vue", bundled: true },
  { id: "angular", label: "Angular" },
  { id: "express", label: "Express" },
  { id: "nestjs", label: "NestJS" },
];

export const MCPS: ModuleEntry[] = [
  { id: "context7", label: "context7 (up-to-date library docs)", bundled: true },
];

export const ENVIRONMENTS: ModuleEntry[] = [
  { id: "node-runtime", label: "Node + version manager (nvm)", bundled: true },
  { id: "python-venv", label: "Python virtual environments", bundled: true },
  { id: "wsl", label: "WSL (Windows + Linux)", bundled: true },
  { id: "docker", label: "Docker / containers", bundled: true },
  { id: "postgres", label: "PostgreSQL", bundled: true },
  { id: "mysql", label: "MySQL / MariaDB" },
  { id: "mongodb", label: "MongoDB" },
  { id: "odoo", label: "Odoo" },
  { id: "linux", label: "Linux" },
  { id: "windows", label: "Windows" },
];

export type ModuleType = "language" | "framework" | "mcp" | "environment";

export function catalog(type: ModuleType): ModuleEntry[] {
  switch (type) {
    case "language":
      return LANGUAGES;
    case "framework":
      return FRAMEWORKS;
    case "mcp":
      return MCPS;
    case "environment":
      return ENVIRONMENTS;
  }
}

export function find(type: ModuleType, id: string): ModuleEntry | undefined {
  return catalog(type).find((m) => m.id === id);
}
