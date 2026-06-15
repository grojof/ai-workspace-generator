import type { Config } from "../config/schema.js";
import { renderTemplate, templateExists } from "../render/engine.js";

export interface Block {
  id: string;
  content: string;
}

function renderLanguage(config: Config, entry: { id: string; version: string }): string {
  const path = `languages/${entry.id}/layer.md.eta`;
  if (templateExists(path)) {
    return renderTemplate(path, { ...config, entry });
  }
  return [
    `## ${entry.id} (Layer 1 — language) · target v${entry.version}`,
    "",
    "- Follow the ecosystem's standard formatter and linter; fail CI on violations.",
    "- Match existing code style and naming. Validate inputs at boundaries.",
    "",
    `> No bundled module yet — query **context7** for \`${entry.id}@${entry.version}\` best practices.`,
  ].join("\n");
}

function renderFramework(config: Config, entry: { id: string; version: string }): string {
  const path = `frameworks/${entry.id}/layer.md.eta`;
  if (templateExists(path)) {
    return renderTemplate(path, { ...config, entry });
  }
  return [
    `## ${entry.id} (Layer 2 — framework) · target v${entry.version}`,
    "",
    "- Follow the framework's idiomatic project structure and patterns.",
    "",
    `> No bundled module yet — query **context7** for \`${entry.id}@${entry.version}\` best practices.`,
  ].join("\n");
}

function renderEnvironment(config: Config, entry: { id: string; version: string }): string {
  const path = `environments/${entry.id}/layer.md.eta`;
  if (templateExists(path)) {
    return renderTemplate(path, { ...config, entry });
  }
  return [
    `## ${entry.id} (Layer 3 — environment) · ${entry.version}`,
    "",
    "- Document the setup steps and gotchas for this environment in this block.",
    "",
    `> No bundled module yet — query **context7** for \`${entry.id}\` setup and best practices.`,
  ].join("\n");
}

/** Compose the ordered managed blocks that make up AGENTS.md (and the Copilot mirror body). */
export function composeBlocks(config: Config): Block[] {
  const blocks: Block[] = [];

  blocks.push({ id: "header", content: renderTemplate("core/header.md.eta", { ...config }) });
  blocks.push({ id: "core", content: renderTemplate("core/conventions.md.eta", { ...config }) });
  blocks.push({ id: "versioning", content: renderTemplate("core/versioning.md.eta", { ...config }) });
  blocks.push({ id: "safety", content: renderTemplate("core/safety.md.eta", { ...config }) });
  blocks.push({ id: "workflow", content: renderTemplate("core/workflow.md.eta", { ...config }) });
  blocks.push({ id: "routing", content: renderTemplate("core/routing.md.eta", { ...config }) });

  for (const lang of config.stack.languages) {
    blocks.push({ id: `lang-${lang.id}`, content: renderLanguage(config, lang) });
  }
  for (const fw of config.stack.frameworks) {
    blocks.push({ id: `fw-${fw.id}`, content: renderFramework(config, fw) });
  }
  for (const env of config.stack.environments) {
    blocks.push({ id: `env-${env.id}`, content: renderEnvironment(config, env) });
  }

  if (config.project.purpose === "learn") {
    blocks.push({ id: "learning", content: renderTemplate("core/learning.md.eta", { ...config }) });
  }

  blocks.push({ id: "company", content: renderTemplate("company/overlay.md.eta", { ...config }) });
  blocks.push({ id: "business", content: renderTemplate("business/domain.md.eta", { ...config }) });

  if (config.sdd.enabled) {
    blocks.push({ id: "sdd", content: renderTemplate("sdd/orchestrator.md.eta", { ...config }) });
  }
  if (config.livingDocs) {
    blocks.push({ id: "living-docs", content: renderTemplate("living-docs/section.md.eta", { ...config }) });
  }

  return blocks;
}
