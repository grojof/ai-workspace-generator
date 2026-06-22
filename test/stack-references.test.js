import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { checkDocCoherence } from "../dist/generate/docCoherence.js";

// 0017a: stack detail (lang/fw/env) moves to references/stack/<id>.md; AGENTS.md keeps resolving pointers;
// Copilot gets an applyTo projection where a glob exists. One source feeds all projections.

function gen(raw) {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-ref-"));
  generate(cwd, ConfigSchema.parse(raw));
  return cwd;
}

test("stack-references · body moves to references/stack/<id>.md; AGENTS.md keeps a resolving pointer", () => {
  const cwd = gen({
    project: { name: "t" },
    stack: { languages: [{ id: "typescript", version: "latest" }] },
  });
  try {
    const ref = resolve(cwd, "references/stack/typescript.md");
    assert.ok(existsSync(ref), "reference generated");
    assert.match(readFileSync(ref, "utf8"), /TypeScript/);

    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const block = agents.match(/begin:aiws:lang-typescript -->([\s\S]*?)<!-- ai-workspace:end/)[1];
    assert.match(block, /references\/stack\/typescript\.md/, "block points to the reference");
    assert.doesNotMatch(
      block,
      /Strict mode|noUncheckedIndexedAccess/,
      "block no longer inlines the full rules",
    );

    // The pointer resolves — 0016a's dangling-ref check stays clean.
    assert.deepEqual(checkDocCoherence(cwd, ConfigSchema.parse({ project: { name: "t" } })).dangling, []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("stack-references · idempotent (reference byte-stable on re-run)", () => {
  const raw = { project: { name: "t" }, stack: { languages: [{ id: "typescript", version: "latest" }] } };
  const cwd = gen(raw);
  try {
    const ref = resolve(cwd, "references/stack/typescript.md");
    const before = readFileSync(ref, "utf8");
    generate(cwd, ConfigSchema.parse(raw));
    assert.equal(readFileSync(ref, "utf8"), before);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("stack-references · Copilot applyTo projection only where a glob exists", () => {
  const cwd = gen({
    project: { name: "t" },
    stack: {
      languages: [{ id: "typescript", version: "latest" }],
      environments: [{ id: "docker", version: "latest" }],
    },
  });
  try {
    const ts = resolve(cwd, ".github/instructions/typescript.instructions.md");
    assert.ok(existsSync(ts), "TS (has a glob) gets an instructions file");
    assert.match(readFileSync(ts, "utf8"), /applyTo: "\*\*\/\*\.ts/);
    assert.equal(
      existsSync(resolve(cwd, ".github/instructions/docker.instructions.md")),
      false,
      "docker (no glob) gets no instructions file",
    );
    assert.ok(existsSync(resolve(cwd, "references/stack/docker.md")), "but docker still has a reference");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("stack-references · no Copilot instructions when copilot is not a target", () => {
  const cwd = gen({
    project: { name: "t" },
    targets: ["claude"],
    stack: { languages: [{ id: "typescript", version: "latest" }] },
  });
  try {
    assert.equal(existsSync(resolve(cwd, ".github/instructions/typescript.instructions.md")), false);
    assert.ok(existsSync(resolve(cwd, "references/stack/typescript.md")), "reference still generated");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
