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

// 0018: the per-stack prose matrix was removed. The craft depth now lives in the language-agnostic
// `references/engineering-practices.md` baseline + skill packs; AGENTS.md keeps only a context7 pointer per
// stack id. No module ships a per-stack `layer.md.eta` anymore — these guards encode SC-003.
test("no language ships a per-stack layer template (0018)", () => {
  for (const m of LANGUAGES) {
    assert.equal(existsSync(templatePath("languages", m.id)), false, `stale layer template for ${m.id}`);
  }
});

test("no framework ships a per-stack layer template (0018)", () => {
  for (const m of FRAMEWORKS) {
    assert.equal(existsSync(templatePath("frameworks", m.id)), false, `stale layer template for ${m.id}`);
  }
});

test("no environment ships a per-stack layer template (0018)", () => {
  for (const m of ENVIRONMENTS) {
    assert.equal(existsSync(templatePath("environments", m.id)), false, `stale layer template for ${m.id}`);
  }
});
