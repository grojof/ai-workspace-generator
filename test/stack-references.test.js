import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { checkDocCoherence } from "../dist/generate/docCoherence.js";

// 0018: the per-stack prose matrix is gone. AGENTS.md keeps a single inline context7 pointer per stack id; the
// craft depth lives in one evergreen `references/engineering-practices.md` reached by a lean hub pointer. No
// per-stack body file and no Copilot per-stack projection are generated.

function gen(raw) {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-ref-"));
  generate(cwd, ConfigSchema.parse(raw));
  return cwd;
}

test("0018 · per-stack block is an inline context7 pointer — no body file, no inlined rules", () => {
  const cwd = gen({
    project: { name: "t" },
    stack: { languages: [{ id: "typescript", version: "latest" }] },
  });
  try {
    // No per-stack body file is produced anymore.
    assert.equal(
      existsSync(resolve(cwd, "references/stack/typescript.md")),
      false,
      "no per-stack reference body",
    );

    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const block = agents.match(/begin:aiws:lang-typescript -->([\s\S]*?)<!-- ai-workspace:end/)[1];
    assert.match(block, /Query \*\*context7\*\* for `typescript@latest`/, "block is a context7 pointer");
    assert.doesNotMatch(block, /references\/stack\/typescript\.md/, "no link to a removed body file");
    assert.doesNotMatch(block, /Strict mode|noUncheckedIndexedAccess/, "no inlined per-stack rules");

    // The dangling-ref check stays clean (nothing left to resolve for the stack block).
    assert.deepEqual(checkDocCoherence(cwd, ConfigSchema.parse({ project: { name: "t" } })).dangling, []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("0018 · engineering-practices baseline is generated and pointed to from the hub", () => {
  const cwd = gen({ project: { name: "t" } });
  try {
    const ref = resolve(cwd, "references/engineering-practices.md");
    assert.ok(existsSync(ref), "baseline reference generated");
    assert.match(readFileSync(ref, "utf8"), /craft baseline/i);

    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const hub = agents.match(/begin:aiws:engineering-practices -->([\s\S]*?)<!-- ai-workspace:end/)[1];
    assert.match(hub, /references\/engineering-practices\.md/, "hub block points to the baseline");

    // The hub pointer resolves — coherence check is clean.
    assert.deepEqual(checkDocCoherence(cwd, ConfigSchema.parse({ project: { name: "t" } })).dangling, []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("0018 · baseline is idempotent (byte-stable on re-run)", () => {
  const raw = { project: { name: "t" } };
  const cwd = gen(raw);
  try {
    const ref = resolve(cwd, "references/engineering-practices.md");
    const before = readFileSync(ref, "utf8");
    generate(cwd, ConfigSchema.parse(raw));
    assert.equal(readFileSync(ref, "utf8"), before);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("0018 · no per-stack Copilot instruction is generated (any stack, copilot target)", () => {
  const cwd = gen({
    project: { name: "t" },
    targets: ["copilot"],
    stack: {
      languages: [{ id: "typescript", version: "latest" }],
      environments: [{ id: "docker", version: "latest" }],
    },
  });
  try {
    assert.equal(existsSync(resolve(cwd, ".github/instructions/typescript.instructions.md")), false);
    assert.equal(existsSync(resolve(cwd, ".github/instructions/docker.instructions.md")), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
