import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { reconcile } from "../dist/commands/reconcile.js";

// ADR 0003 Part F: aiws-reconcile classifies company overlays vs the base (unique/redundant/conflict/drift),
// read-only — the skill turns it into propose-and-review.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-rec-"));
}

function companyPack(cwd, id, relation) {
  const dir = resolve(cwd, ".ai-workspace/packs", id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "pack.yaml"), `id: ${id}\nloadMode: on-demand\nrelation: ${relation}\n`);
}

test("reconcile · classifies new=unique, overrides-live=conflict, overrides-missing=redundant", () => {
  const cwd = tmpRepo();
  try {
    companyPack(cwd, "corp-acme-greeting", "new");
    companyPack(cwd, "corp-acme-commit", "overrides:aiws-secure-commit"); // a real base id
    companyPack(cwd, "corp-acme-ghost", "overrides:aiws-gone-from-base"); // not in the base
    const byUnit = Object.fromEntries(reconcile(cwd).map((f) => [f.unit, f.kind]));
    assert.equal(byUnit["corp-acme-greeting"], "unique");
    assert.equal(byUnit["corp-acme-commit"], "conflict");
    assert.equal(byUnit["corp-acme-ghost"], "redundant");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("reconcile · clean repo (no company packs, no manifest) ⇒ no findings", () => {
  const cwd = tmpRepo();
  try {
    assert.deepEqual(reconcile(cwd), []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("reconcile · the skill + command are generated only when an org is set", () => {
  const withOrg = tmpRepo();
  const noOrg = tmpRepo();
  try {
    generate(withOrg, ConfigSchema.parse({ project: { name: "t" }, company: "example" }));
    generate(noOrg, ConfigSchema.parse({ project: { name: "t" } }));
    assert.ok(existsSync(resolve(withOrg, ".claude/skills/aiws-reconcile/SKILL.md")));
    assert.ok(existsSync(resolve(withOrg, ".claude/commands/aiws-reconcile.md")));
    assert.equal(existsSync(resolve(noOrg, ".claude/skills/aiws-reconcile/SKILL.md")), false);
    // Propose-and-review: the skill leads with the read-only CLI and never auto-applies.
    const skill = readFileSync(resolve(withOrg, ".claude/skills/aiws-reconcile/SKILL.md"), "utf8");
    assert.match(skill, /ai-workspace reconcile/);
    assert.match(skill, /wait for approval/i);
    assert.match(skill, /never auto-apply/i);
  } finally {
    rmSync(withOrg, { recursive: true, force: true });
    rmSync(noOrg, { recursive: true, force: true });
  }
});
