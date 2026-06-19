import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { LANGUAGES, FRAMEWORKS, ENVIRONMENTS } from "../dist/modules/registry.js";
import { templatesDir } from "../dist/render/engine.js";

const dir = templatesDir();

function templatePath(kind, id) {
  return resolve(dir, `${kind}/${id}/layer.md.eta`);
}

// AI-facing artifacts are English-only (token efficiency), so bundled modules ship a single base
// template — no per-language mirror. Human docs are localized elsewhere.
test("every bundled language has a base template", () => {
  for (const m of LANGUAGES.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("languages", m.id)), `missing base template for ${m.id}`);
  }
});

test("every bundled framework has a base template", () => {
  for (const m of FRAMEWORKS.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("frameworks", m.id)), `missing base template for ${m.id}`);
  }
});

test("every bundled environment has a base template", () => {
  for (const m of ENVIRONMENTS.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("environments", m.id)), `missing base template for ${m.id}`);
  }
});
