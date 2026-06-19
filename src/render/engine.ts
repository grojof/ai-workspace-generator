import { Eta } from "eta";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

/** Absolute path to the shipped `templates/` directory (works in dev and dist). */
export function templatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // here is <pkg>/src/render or <pkg>/dist/render -> templates is two levels up
  const candidate = resolve(here, "../../templates");
  if (!existsSync(candidate)) {
    throw new Error(`Templates directory not found at ${candidate}`);
  }
  return candidate;
}

let eta: Eta | null = null;
let locale = "en";

/** Set the active locale; localized templates live under templates/i18n/<locale>/. */
export function setLocale(l: string): void {
  locale = l;
}

function engine(): Eta {
  if (!eta) {
    eta = new Eta({
      views: templatesDir(),
      autoEscape: false,
      autoTrim: false,
      rmWhitespace: false,
    });
  }
  return eta;
}

/**
 * Render a template (path relative to templates/). If a localized override exists
 * at templates/i18n/<locale>/<relPath>, it wins; otherwise the base file is used.
 */
export function renderTemplate(relPath: string, data: Record<string, unknown>): string {
  const localized = `i18n/${locale}/${relPath}`;
  const chosen = locale !== "en" && existsSync(resolve(templatesDir(), localized)) ? localized : relPath;
  return engine().render(chosen, data);
}

/** Render an inline template string. */
export function renderString(tpl: string, data: Record<string, unknown>): string {
  return engine().renderString(tpl, data);
}

/** Whether a template file exists (relative to templates/). */
export function templateExists(relPath: string): boolean {
  const full = relPath.endsWith(".eta") ? relPath : `${relPath}.eta`;
  return existsSync(resolve(templatesDir(), full));
}
