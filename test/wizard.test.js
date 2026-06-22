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
const basics = (over = {}) => ({
  name: "demo",
  language: "es",
  targets: ["claude", "copilot"],
  userType: "technical",
  experience: "standard",
  ...over,
});

test("simpleDefaults: a detected stack ⇒ existing mode, stack accepted, safetyGuard off; profile from basics", () => {
  const i = simpleDefaults(DETECTED, basics());
  assert.equal(i.mode, "existing");
  assert.equal(i.userType, "technical"); // from basics, not inferred
  assert.equal(i.experience, "standard"); // from basics, not hardcoded
  assert.equal(i.purpose, "build");
  assert.equal(i.company, "none");
  assert.deepEqual(i.langIds, ["typescript"]);
  assert.deepEqual(i.fwIds, ["react"]);
  assert.deepEqual(i.envIds, ["docker"]);
  assert.equal(i.safetyGuard, "off");
  assert.equal(i.sddEnabled, true);
  assert.equal(i.useContext7, true);
});

test("simpleDefaults: no detected stack ⇒ new mode, empty stack, safetyGuard warn", () => {
  const i = simpleDefaults(EMPTY, basics());
  assert.equal(i.mode, "new");
  assert.deepEqual(i.langIds, []);
  assert.equal(i.safetyGuard, "warn");
});

test("simpleDefaults: profile is independent of detection (never silently inferred)", () => {
  // A detected (existing) stack with an explicit business/beginner profile must be honored verbatim.
  const i = simpleDefaults(DETECTED, basics({ userType: "business", experience: "beginner" }));
  assert.equal(i.mode, "existing"); // mode still derives from detection
  assert.equal(i.userType, "business"); // profile comes from the user's choice
  assert.equal(i.experience, "beginner");
  // And an empty stack with a technical/advanced choice is likewise honored.
  const j = simpleDefaults(EMPTY, basics({ userType: "technical", experience: "advanced" }));
  assert.equal(j.mode, "new");
  assert.equal(j.userType, "technical");
  assert.equal(j.experience, "advanced");
});

test("buildConfig(simpleDefaults) ⇒ valid Config with documented Simple defaults + detected versions", () => {
  const c = buildConfig(simpleDefaults(DETECTED, basics()), DETECTED);
  assert.equal(c.company.id, "none");
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
    name: "app",
    description: "x",
    language: "en",
    mode: "new",
    purpose: "build",
    userType: "technical",
    experience: "advanced",
    company: "example",
    targets: ["claude"],
    langIds: ["go"],
    fwIds: [],
    envIds: ["wsl"],
    sddEnabled: true,
    sddBackend: "files",
    sddMethodology: "sdd",
    livingDocs: false,
    useContext7: false,
    safetyGuard: "block",
  };
  const c = buildConfig(inputs, EMPTY);
  assert.equal(c.company.id, "example");
  assert.equal(c.sdd.schema, "reasons"); // company !== none ⇒ reasons
  assert.deepEqual(c.stack.languages, [{ id: "go", version: "latest" }]); // not detected ⇒ latest
  assert.deepEqual(c.mcp, []); // context7 off
  assert.equal(c.livingDocs, false);
  assert.equal(c.workflow.hooks.safetyGuard, "block");
});
