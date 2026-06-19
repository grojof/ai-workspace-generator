import test from "node:test";
import assert from "node:assert/strict";
import { ConfigSchema, resolveRepos } from "../dist/config/schema.js";

test("applies sensible defaults from a minimal config", () => {
  const c = ConfigSchema.parse({ project: { name: "demo" } });
  assert.equal(c.language, "es");
  assert.deepEqual(c.targets, ["claude", "copilot"]);
  assert.equal(c.project.mode, "new");
  assert.equal(c.sdd.backend, "files");
  assert.equal(c.workflow.commits.coAuthor, false);
  assert.equal(c.workflow.commits.automate, "with-approval");
  assert.equal(c.workflow.safetyGate, true);
});

test("rejects an invalid config (missing project.name)", () => {
  const r = ConfigSchema.safeParse({ targets: ["claude"] });
  assert.equal(r.success, false);
});

test("rejects an unknown language", () => {
  const r = ConfigSchema.safeParse({ project: { name: "x" }, language: "fr" });
  assert.equal(r.success, false);
});

test("multi-repo: repos[] is additive — a single-repo config validates and has empty repos", () => {
  const c = ConfigSchema.parse({ project: { name: "solo" } });
  assert.deepEqual(c.repos, []);
});

test("multi-repo: resolveRepos normalizes single- and multi-repo to one shape", () => {
  // Single-repo → the workspace dir itself, inheriting the root stack.
  const single = ConfigSchema.parse({ project: { name: "solo" }, stack: { languages: [{ id: "typescript", version: "latest" }] } });
  const rs = resolveRepos(single);
  assert.equal(rs.length, 1);
  assert.equal(rs[0].path, ".");
  assert.equal(rs[0].name, "solo");
  assert.deepEqual(rs[0].stack.languages, [{ id: "typescript", version: "latest" }]);

  // Multi-repo → each repo's effective stack is its own, or the root default.
  const multi = ConfigSchema.parse({
    project: { name: "ws" },
    stack: { languages: [{ id: "typescript", version: "latest" }] },
    repos: [
      { path: "./api", stack: { languages: [{ id: "go", version: "latest" }] } },
      { path: "./web" },
    ],
  });
  const rm = resolveRepos(multi);
  assert.equal(rm.length, 2);
  assert.equal(rm[0].path, "./api");
  assert.deepEqual(rm[0].stack.languages, [{ id: "go", version: "latest" }]); // own stack
  assert.equal(rm[1].path, "./web");
  assert.deepEqual(rm[1].stack.languages, [{ id: "typescript", version: "latest" }]); // root default
});
