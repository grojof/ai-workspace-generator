import test from "node:test";
import assert from "node:assert/strict";
import { buildConfig, simpleDefaults } from "../dist/commands/wizard.js";

const EMPTY = { languages: [], frameworks: [], environments: [], notes: [] };
const DETECTED = {
  languages: [{ id: "typescript", version: "6" }],
  frameworks: [{ id: "react", version: "18" }],
  environments: [{ id: "docker", version: "latest" }],
  runtime: "node@20",
  notes: [],
};
const basics = (over = {}) => ({ name: "demo", language: "es", targets: ["claude", "copilot"], ...over });

test("simpleDefaults: a detected stack ⇒ existing + technical, stack accepted, safetyGuard off", () => {
  const i = simpleDefaults(DETECTED, basics());
  assert.equal(i.mode, "existing");
  assert.equal(i.userType, "technical");
  assert.equal(i.experience, "standard");
  assert.equal(i.purpose, "build");
  assert.equal(i.company, "none");
  assert.deepEqual(i.langIds, ["typescript"]);
  assert.deepEqual(i.fwIds, ["react"]);
  assert.deepEqual(i.envIds, ["docker"]);
  assert.equal(i.safetyGuard, "off");
  assert.equal(i.sddEnabled, true);
  assert.equal(i.useContext7, true);
});

test("simpleDefaults: no detected stack ⇒ new + business, empty stack, safetyGuard warn", () => {
  const i = simpleDefaults(EMPTY, basics());
  assert.equal(i.mode, "new");
  assert.equal(i.userType, "business");
  assert.deepEqual(i.langIds, []);
  assert.equal(i.safetyGuard, "warn");
});

test("buildConfig(simpleDefaults) ⇒ valid Config with documented Simple defaults + detected versions", () => {
  const c = buildConfig(simpleDefaults(DETECTED, basics()), DETECTED);
  assert.equal(c.company, "none");
  assert.equal(c.sdd.enabled, true);
  assert.equal(c.sdd.backend, "files");
  assert.equal(c.sdd.methodology, "sdd");
  assert.equal(c.sdd.schema, "lean"); // company none ⇒ lean
  assert.equal(c.livingDocs, true);
  assert.deepEqual(c.mcp, ["context7"]);
  assert.deepEqual(c.stack.languages, [{ id: "typescript", version: "6" }]); // version from detection
  assert.equal(c.stack.runtime, "node@20");
});

test("buildConfig: advanced-like input maps stack + company⇒reasons + context7 off ⇒ no mcp", () => {
  const inputs = {
    name: "app", description: "x", language: "en",
    mode: "new", purpose: "build", userType: "technical", experience: "advanced",
    company: "example", targets: ["claude"],
    langIds: ["go"], fwIds: [], envIds: ["wsl"],
    sddEnabled: true, sddBackend: "files", sddMethodology: "sdd",
    livingDocs: false, useContext7: false, safetyGuard: "block",
  };
  const c = buildConfig(inputs, EMPTY);
  assert.equal(c.company, "example");
  assert.equal(c.sdd.schema, "reasons"); // company !== none ⇒ reasons
  assert.deepEqual(c.stack.languages, [{ id: "go", version: "latest" }]); // not detected ⇒ latest
  assert.deepEqual(c.mcp, []); // context7 off
  assert.equal(c.livingDocs, false);
  assert.equal(c.workflow.hooks.safetyGuard, "block");
});
