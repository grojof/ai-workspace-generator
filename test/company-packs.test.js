import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { saveConfig } from "../dist/config/loader.js";
import { generate } from "../dist/generate/index.js";
import { parsePackSource, runPacksSync } from "../dist/commands/packsSync.js";
import { loadCompanyPacks } from "../dist/generate/stackPacks.js";

// ADR 0003 F2c: company is `{ id, packs }`; git company packs are vendored into .ai-workspace/packs/ (pinned),
// loaded by generate, and may NOT impersonate the reserved `aiws` namespace.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-cp-"));
}

const git = (cwd, ...args) =>
  execFileSync("git", ["-C", cwd, ...args], { stdio: ["ignore", "ignore", "ignore"] });

/** Build a local git repo that holds a company pack at tag `v1`, and return its path + the pack id. */
function makeCompanyPackRepo(id = "corp-acme-greeting") {
  const repo = tmpRepo();
  execFileSync("git", ["init", "-q", repo], { stdio: "ignore" });
  git(repo, "config", "user.email", "t@example.com");
  git(repo, "config", "user.name", "Test");
  const dir = join(repo, "skill-packs", id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "pack.yaml"),
    `id: ${id}\nprofile:\n  userType: [technical]\nloadMode: on-demand\nrelation: new\ntrigger:\n  en: company greeting policy\n  es: politica de saludo\n`,
  );
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${id}\n---\n\n## ${id}\n\nCompany greeting rules.\n`);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "pack");
  git(repo, "tag", "v1");
  return { repo, id };
}

test("company packs · parsePackSource requires a pinned ref", () => {
  assert.deepEqual(parsePackSource("git+https://x/y.git#v1.2.0"), { url: "https://x/y.git", ref: "v1.2.0" });
  assert.deepEqual(parsePackSource("https://x/y.git#main"), { url: "https://x/y.git", ref: "main" });
  assert.throws(() => parsePackSource("https://x/y.git"), /not pinned/);
});

test("company config · a bare string normalises to { id, packs: [] }", () => {
  assert.deepEqual(ConfigSchema.parse({ project: { name: "t" }, company: "example" }).company, {
    id: "example",
    packs: [],
  });
  assert.equal(ConfigSchema.parse({ project: { name: "t" } }).company.id, "none");
  const obj = ConfigSchema.parse({
    project: { name: "t" },
    company: { id: "corp-acme", packs: ["git+u#v1"] },
  }).company;
  assert.deepEqual(obj, { id: "corp-acme", packs: ["git+u#v1"] });
});

test("company packs · packs sync vendors a git pack (pinned); generate emits it", () => {
  const { repo, id } = makeCompanyPackRepo();
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({
      project: { name: "t" },
      company: { id: "corp-acme", packs: [`git+${repo}#v1`] },
    });
    saveConfig(cwd, config);
    runPacksSync(cwd);
    // Vendored + pinned in the lock.
    assert.ok(existsSync(resolve(cwd, `.ai-workspace/packs/${id}/pack.yaml`)));
    const lock = JSON.parse(readFileSync(resolve(cwd, ".ai-workspace/packs/packs-lock.json"), "utf8"));
    assert.equal(lock.packs[0].ref, "v1");
    assert.match(lock.packs[0].sha, /^[0-9a-f]{40}$/);
    assert.deepEqual(lock.packs[0].ids, [id]);
    // generate emits the company skill (technical profile, no stack binding ⇒ applies).
    generate(cwd, config);
    assert.ok(existsSync(resolve(cwd, `.claude/skills/${id}/SKILL.md`)));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("company packs · an external pack may not claim the reserved aiws namespace", () => {
  const cwd = tmpRepo();
  try {
    const dir = resolve(cwd, ".ai-workspace/packs/aiws-impostor");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "pack.yaml"), "id: aiws-impostor\nloadMode: on-demand\n");
    assert.throws(() => loadCompanyPacks(cwd), /reserved `aiws` namespace/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
