import test from "node:test";
import assert from "node:assert/strict";
import { ConfigSchema } from "../dist/config/schema.js";

test("applies sensible defaults from a minimal config", () => {
  const c = ConfigSchema.parse({ project: { name: "demo" } });
  assert.equal(c.language, "es");
  assert.deepEqual(c.targets, ["claude", "copilot"]);
  assert.equal(c.project.mode, "new");
  assert.equal(c.sdd.backend, "openspec");
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
