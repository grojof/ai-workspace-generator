import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// PR3 (0008): the `methodology` axis (sdd | spdd). SPDD reuses the /sdd-* family and the `reasons`
// skills — it is not a fork; it only reframes the orchestrator and forces the REASONS Canvas schema.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-meth-"));
}

test("methodology · spdd implies the reasons schema (E2)", () => {
  const spdd = ConfigSchema.parse({ project: { name: "t" }, sdd: { methodology: "spdd", schema: "lean" } });
  assert.equal(spdd.sdd.schema, "reasons");
  // sdd keeps whatever schema was asked for.
  const sdd = ConfigSchema.parse({ project: { name: "t" }, sdd: { methodology: "sdd", schema: "lean" } });
  assert.equal(sdd.sdd.schema, "lean");
  // default methodology is sdd (backward compatible).
  assert.equal(ConfigSchema.parse({ project: { name: "t" } }).sdd.methodology, "sdd");
});

test("methodology · spdd reframes the orchestrator and ships the reasons machinery (E3)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, sdd: { methodology: "spdd" } }));
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /Structured-Prompt-Driven Development \(SPDD\)/);
    assert.match(agents, /REASONS Canvas/);
    assert.match(agents, /fix the prompt first/i);
    // Reuses the /sdd-* family — no parallel /spdd-* commands.
    assert.doesNotMatch(agents, /\/spdd-/);
    // spdd => reasons => the reasons skills are generated.
    assert.ok(readFileSync(resolve(cwd, ".claude/skills/sdd-spec-schema/SKILL.md"), "utf8"));
    assert.equal(existsSync(resolve(cwd, ".claude/commands/spdd-story.md")), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("methodology · sdd (default) leaves the orchestrator as plain SDD (E4)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /## Spec-Driven Development \(SDD\)/);
    assert.doesNotMatch(agents, /Structured-Prompt-Driven/);
    assert.doesNotMatch(agents, /fix the prompt first/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("methodology · spdd wires the sync loop; sdd does not (0009 E1-E4)", () => {
  const spdd = tmpRepo();
  const sdd = tmpRepo();
  const reasons = tmpRepo();
  try {
    generate(spdd, ConfigSchema.parse({ project: { name: "t" }, sdd: { methodology: "spdd" } }));
    generate(sdd, ConfigSchema.parse({ project: { name: "t" } }));
    // reasons WITHOUT spdd: the sync loop must NOT appear (gated to methodology, not schema).
    generate(reasons, ConfigSchema.parse({ project: { name: "t" }, company: "example" })); // company overlay, methodology sdd
    const has = (d, p) => existsSync(resolve(d, p));

    // E1: skill + command only under spdd.
    assert.ok(has(spdd, ".claude/skills/sdd-spec-sync/SKILL.md"));
    assert.ok(has(spdd, ".claude/commands/aiws-sdd-sync.md"));
    assert.equal(has(sdd, ".claude/skills/sdd-spec-sync/SKILL.md"), false);
    assert.equal(has(sdd, ".claude/commands/aiws-sdd-sync.md"), false);
    assert.equal(has(reasons, ".claude/skills/sdd-spec-sync/SKILL.md"), false);

    // E2: orchestrator documents the loop under spdd only.
    assert.match(readFileSync(resolve(spdd, "AGENTS.md"), "utf8"), /\/aiws-sdd-sync.*sdd-spec-sync|sdd-spec-sync.*\/aiws-sdd-sync/s);
    assert.doesNotMatch(readFileSync(resolve(sdd, "AGENTS.md"), "utf8"), /sdd-spec-sync/);

    // E3: prompt→code half reused (sdd-code-maintenance present under spdd), no /spdd-* commands.
    assert.ok(has(spdd, ".claude/skills/sdd-code-maintenance/SKILL.md"));
    assert.equal(has(spdd, ".claude/commands/spdd-sync.md"), false);

    // E4: the skill is propose-and-review (no auto-apply).
    const skill = readFileSync(resolve(spdd, ".claude/skills/sdd-spec-sync/SKILL.md"), "utf8");
    assert.match(skill, /propose/i);
    assert.match(skill, /approval|approve/i);
    assert.match(skill, /no auto-apply/i);
  } finally {
    for (const d of [spdd, sdd, reasons]) rmSync(d, { recursive: true, force: true });
  }
});

test("methodology · spdd generation is idempotent (E5)", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" }, sdd: { methodology: "spdd" } });
    generate(cwd, config);
    const second = generate(cwd, config);
    assert.equal(second.artifacts.filter((a) => a.status !== "unchanged").length, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
