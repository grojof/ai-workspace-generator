import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { saveConfig } from "../dist/config/loader.js";
import { runImport } from "../dist/commands/import.js";
import { runUpgrade } from "../dist/commands/upgrade.js";
import { runRemove } from "../dist/commands/remove.js";
import { TEMPLATES_VERSION } from "../dist/version.js";

function setup(overrides = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-cmd-"));
  const config = ConfigSchema.parse({ project: { name: "t" }, ...overrides });
  saveConfig(cwd, config);
  generate(cwd, config);
  return { cwd, config };
}

test("import ingests assets and writes provenance + reconcile checklist", () => {
  const { cwd } = setup();
  try {
    const src = resolve(cwd, "_legacy");
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, "CONVENTIONS.md"), "# Conventions\nUse Gtm prefix.");
    writeFileSync(join(src, ".eslintrc.json"), "{}");

    runImport(cwd, ["./_legacy"]);

    assert.ok(existsSync(resolve(cwd, "docs/development/status/INGEST-RECONCILE.md")), "checklist missing");
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /ai-workspace:begin:imported/);
    const cfg = readFileSync(resolve(cwd, "workspace.config.yaml"), "utf8");
    assert.match(cfg, /_legacy/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("upgrade applies and bumps templatesVersion", () => {
  const { cwd } = setup({ templatesVersion: "0.0.1" });
  try {
    runUpgrade(cwd, {});
    const cfg = readFileSync(resolve(cwd, "workspace.config.yaml"), "utf8");
    assert.match(cfg, new RegExp(`templatesVersion: ${TEMPLATES_VERSION.replace(/\./g, "\\.")}`));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("upgrade --check does not write changes", () => {
  const { cwd } = setup({ templatesVersion: "0.0.1" });
  try {
    runUpgrade(cwd, { check: true });
    const cfg = readFileSync(resolve(cwd, "workspace.config.yaml"), "utf8");
    assert.match(cfg, /templatesVersion: 0\.0\.1/); // unchanged in check mode
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("remove strips the module's block from AGENTS.md", () => {
  const { cwd } = setup({ stack: { languages: [{ id: "typescript", version: "5" }, { id: "go", version: "1" }] } });
  try {
    let agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /ai-workspace:begin:lang-go/);
    runRemove(cwd, "language", "go");
    agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.doesNotMatch(agents, /ai-workspace:begin:lang-go/, "go block should be gone");
    assert.match(agents, /ai-workspace:begin:lang-typescript/, "typescript block should remain");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
