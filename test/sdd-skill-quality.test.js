import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// 0012a: generated SDD phase skills must sit at the "right altitude" — an intent-based description (not a
// circular trigger), the inputs to read, an output template, and a quality bar; the command is a thin launcher
// (no duplicated substance). Pins the quality so it cannot silently regress to the old thin form.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-sddq-"));
}

test("sdd skill · rich, intent-based, with template + quality bar (not a circular trigger)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const skill = readFileSync(resolve(cwd, ".claude/skills/aiws-sdd-spec/SKILL.md"), "utf8");
    // Intent-based description (Agent Skills: what + when + key terms), NOT the old circular trigger.
    assert.match(skill, /source of truth for behaviour/);
    assert.doesNotMatch(skill, /Trigger: when planning\/executing the .* phase/);
    // Right-altitude signals: inputs, an output template, and a quality checklist.
    assert.match(skill, /## Read first/);
    assert.match(skill, /## Produce — `spec\.md`/);
    assert.match(skill, /## Quality bar/);
    assert.match(skill, /- \[ \] Every requirement is verifiable/);
    assert.match(skill, /RFC 2119/);
    // 0012b: the spec is a delta in the OpenSpec format with NEEDS CLARIFICATION markers.
    assert.match(skill, /## ADDED Requirements/);
    assert.match(skill, /### Requirement:/);
    assert.match(skill, /#### Scenario:/);
    assert.match(skill, /\[NEEDS CLARIFICATION/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("sdd convention · documents the delta format + archive merge rules (0012b)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const conv = readFileSync(resolve(cwd, ".claude/skills/_shared/sdd-convention.md"), "utf8");
    assert.match(conv, /## Delta spec format \(OpenSpec\)/);
    assert.match(conv, /## ADDED Requirements/);
    assert.match(conv, /## Archive merge rules/);
    assert.match(conv, /\*\*ADDED\*\* → append/);
    assert.match(conv, /\*\*MODIFIED\*\* → replace/);
    assert.match(conv, /\*\*REMOVED\*\* → delete/);
    // 0012d: the eval pattern is documented (lean tier gets it too).
    assert.match(conv, /## Evaluating a skill/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("sdd convention · is regenerated, not write-if-missing — sync restores it (0012d)", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" } });
    generate(cwd, config);
    const path = resolve(cwd, ".claude/skills/_shared/sdd-convention.md");
    writeFileSync(path, "STALE hand-edited convention\n");
    // A re-sync overwrites the stale copy back to canonical (it is OUR reference, not a user scaffold).
    generate(cwd, config);
    const conv = readFileSync(path, "utf8");
    assert.doesNotMatch(conv, /STALE hand-edited/);
    assert.match(conv, /## Delta spec format \(OpenSpec\)/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("sdd command · thin launcher that points to the skill (no duplicated substance)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const cmd = readFileSync(resolve(cwd, ".claude/commands/aiws-sdd-spec.md"), "utf8");
    assert.match(cmd, /Run the \*\*`aiws-sdd-spec`\*\* skill/);
    // The command must NOT re-embed the skill's template/checklist (that's the overlap we removed).
    assert.doesNotMatch(cmd, /## Quality bar/);
    assert.doesNotMatch(cmd, /Acceptance scenarios \(Given/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("sdd copilot prompt · substantive (Copilot has no skill to launch) but derived from phase data", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, targets: ["copilot"] }));
    const prompt = readFileSync(resolve(cwd, ".github/prompts/aiws-sdd-spec.prompt.md"), "utf8");
    assert.match(prompt, /## Produce — `spec\.md`/);
    assert.match(prompt, /## Quality bar/);
    assert.match(prompt, /Follow the SDD lifecycle documented in `AGENTS\.md`/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
