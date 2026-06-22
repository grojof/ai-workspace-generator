import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
