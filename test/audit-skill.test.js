import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// 0016b: a generated `aiws-audit` skill + `/aiws-audit` command produce a read-only, dated self-audit report.

const CONFIG = ConfigSchema.parse({
  project: { name: "t" },
  stack: { languages: [{ id: "typescript", version: "latest" }] },
});

function fresh() {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-audit-"));
  generate(cwd, CONFIG);
  return cwd;
}

test("audit · skill + command are generated for the claude target", () => {
  const cwd = fresh();
  try {
    assert.ok(existsSync(resolve(cwd, ".claude/skills/aiws-audit/SKILL.md")), "skill generated");
    assert.ok(existsSync(resolve(cwd, ".claude/commands/aiws-audit.md")), "command generated");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("audit · skill is read-only, evidence-driven, and writes a dated report", () => {
  const cwd = fresh();
  try {
    const skill = readFileSync(resolve(cwd, ".claude/skills/aiws-audit/SKILL.md"), "utf8");
    // Read-only contract (never fixes — fixes go through the normal flow).
    assert.match(skill, /read-only/i);
    assert.match(skill, /never\s+fixes?/i);
    // Composes the deterministic signals rather than guessing.
    assert.match(skill, /ai-workspace doctor/);
    assert.match(skill, /ai-workspace verify/);
    // Dated, self-feeding report under the development docs.
    assert.match(skill, /audits\/<YYYY-MM-DD>-audit\.md/);
    // Has a quality bar (0012a skill standard).
    assert.match(skill, /## Quality bar/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("audit · the routing block lists aiws-audit (registered, on-demand)", () => {
  const cwd = fresh();
  try {
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /aiws-audit/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
