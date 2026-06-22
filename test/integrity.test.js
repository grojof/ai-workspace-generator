import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { verify } from "../dist/commands/verify.js";

// ADR 0003 Part E: a generated `.ai-workspace/manifest.json` fingerprints base-owned artifacts so `verify`
// catches tampering, renamed/orphaned markers, in-region drift and deletions — while leaving the user's own
// prose (outside `aiws:*` markers) and user-owned files free to change.

const CONFIG = ConfigSchema.parse({
  project: { name: "t" },
  company: "example",
  stack: { languages: [{ id: "typescript", version: "latest" }] },
});

function fresh() {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-int-"));
  generate(cwd, CONFIG);
  return cwd;
}

const errs = (cwd) => verify(cwd).findings.filter((f) => f.level === "error");

test("integrity · generate writes a committed manifest; a fresh repo verifies clean; idempotent", () => {
  const cwd = fresh();
  try {
    const mPath = resolve(cwd, ".ai-workspace/manifest.json");
    assert.ok(existsSync(mPath), "manifest written");
    const m = JSON.parse(readFileSync(mPath, "utf8"));
    assert.equal(m.version, 1);
    assert.ok(
      m.entries.some((e) => e.path === "AGENTS.md" && e.kind === "managed" && e.blocks.includes("aiws:core")),
    );
    assert.ok(m.entries.some((e) => e.path.startsWith(".claude/skills/aiws-") && e.kind === "file"));
    // The manifest never lists itself.
    assert.ok(!m.entries.some((e) => e.path.includes("manifest.json")));

    const { artifacts } = generate(cwd, CONFIG); // second run
    assert.equal(
      artifacts.filter((a) => a.path === ".ai-workspace/manifest.json" && a.status !== "unchanged").length,
      0,
    );
    assert.equal(verify(cwd).ok, true);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("integrity · editing a MANAGED region (inside aiws: markers) is flagged as drift", () => {
  const cwd = fresh();
  try {
    const p = resolve(cwd, "AGENTS.md");
    const txt = readFileSync(p, "utf8").replace("Conventional Commits", "TAMPERED Commits");
    writeFileSync(p, txt);
    const e = errs(cwd);
    assert.ok(
      e.some((f) => f.path === "AGENTS.md" && /in-band/.test(f.message)),
      `expected in-band drift, got ${JSON.stringify(e)}`,
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("integrity · user prose OUTSIDE markers does NOT trip verify (no false positive)", () => {
  const cwd = fresh();
  try {
    const p = resolve(cwd, "AGENTS.md");
    writeFileSync(p, "MY OWN TOP NOTE\n\n" + readFileSync(p, "utf8") + "\n\nMY OWN BOTTOM NOTE\n");
    assert.equal(verify(cwd).ok, true, "out-of-band edits must be allowed");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("integrity · removing a managed block is flagged as a renamed/removed marker", () => {
  const cwd = fresh();
  try {
    const p = resolve(cwd, "AGENTS.md");
    const txt = readFileSync(p, "utf8").replace(
      /<!-- ai-workspace:begin:aiws:business -->[\s\S]*?<!-- ai-workspace:end:aiws:business -->/,
      "",
    );
    writeFileSync(p, txt);
    assert.ok(errs(cwd).some((f) => /removed\/renamed/.test(f.message)));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("integrity · editing an owned skill file, and deleting a base artifact, are flagged", () => {
  const cwd = fresh();
  try {
    const skill = resolve(cwd, ".claude/skills/aiws-secure-commit/SKILL.md");
    writeFileSync(skill, readFileSync(skill, "utf8") + "\nTAMPER\n");
    assert.ok(
      errs(cwd).some(
        (f) => f.path.endsWith("aiws-secure-commit/SKILL.md") && /file content edited/.test(f.message),
      ),
    );

    rmSync(skill, { force: true });
    assert.ok(
      errs(cwd).some((f) => f.path.endsWith("aiws-secure-commit/SKILL.md") && /deleted/.test(f.message)),
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
