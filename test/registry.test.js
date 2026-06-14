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
function esTemplatePath(kind, id) {
  return resolve(dir, `i18n/es/${kind}/${id}/layer.md.eta`);
}

test("every bundled language has base + Spanish templates", () => {
  for (const m of LANGUAGES.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("languages", m.id)), `missing base template for ${m.id}`);
    assert.ok(existsSync(esTemplatePath("languages", m.id)), `missing es template for ${m.id}`);
  }
});

test("every bundled framework has base + Spanish templates", () => {
  for (const m of FRAMEWORKS.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("frameworks", m.id)), `missing base template for ${m.id}`);
    assert.ok(existsSync(esTemplatePath("frameworks", m.id)), `missing es template for ${m.id}`);
  }
});

test("every bundled environment has base + Spanish templates", () => {
  for (const m of ENVIRONMENTS.filter((x) => x.bundled)) {
    assert.ok(existsSync(templatePath("environments", m.id)), `missing base template for ${m.id}`);
    assert.ok(existsSync(esTemplatePath("environments", m.id)), `missing es template for ${m.id}`);
  }
});
