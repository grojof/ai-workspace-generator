import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-test-"));
}

test("generate creates AGENTS.md with governance blocks", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({
      project: { name: "t", mode: "new" },
      stack: { languages: [{ id: "typescript", version: "5" }] },
    });
    generate(cwd, config);
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    for (const id of ["header", "core", "versioning", "safety", "workflow", "lang-typescript"]) {
      assert.match(agents, new RegExp(`ai-workspace:begin:${id}`), `missing block ${id}`);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("second generate is fully idempotent", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" } });
    generate(cwd, config);
    const second = generate(cwd, config);
    const changed = second.artifacts.filter((a) => a.status !== "unchanged");
    assert.equal(changed.length, 0, `unexpected changes: ${changed.map((a) => a.path).join(", ")}`);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("language es produces Spanish content; en produces English", () => {
  const es = tmpRepo();
  const en = tmpRepo();
  try {
    generate(es, ConfigSchema.parse({ project: { name: "t" }, language: "es" }));
    generate(en, ConfigSchema.parse({ project: { name: "t" }, language: "en" }));
    assert.match(readFileSync(resolve(es, "AGENTS.md"), "utf8"), /Convenciones universales/);
    assert.match(readFileSync(resolve(en, "AGENTS.md"), "utf8"), /Universal conventions/);
  } finally {
    rmSync(es, { recursive: true, force: true });
    rmSync(en, { recursive: true, force: true });
  }
});

test("learn purpose generates the tutor skill and learning block", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t", purpose: "learn" } }));
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:learning/);
    assert.ok(readFileSync(resolve(cwd, ".claude/skills/learn/SKILL.md"), "utf8"));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("environment modules render a block", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, stack: { environments: [{ id: "wsl", version: "latest" }] } }));
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:env-wsl/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("commit-msg hook is generated and blocks co-author", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const hook = readFileSync(resolve(cwd, ".githooks/commit-msg"), "utf8");
    assert.match(hook, /Co-Authored-By/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
