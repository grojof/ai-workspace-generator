import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { checkDocCoherence } from "../dist/generate/docCoherence.js";

// 0016a R3/R4: doctor's doc-coherence checks — dangling references + orphan docs, conservative and
// whitelist-driven, scoped to the maintained docs (project docs + top-level docs/*.md).

const CONFIG = ConfigSchema.parse({
  project: { name: "t" },
  stack: { languages: [{ id: "typescript", version: "latest" }] },
});

function fresh() {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-coh-"));
  generate(cwd, CONFIG);
  return cwd;
}

test("coherence · a freshly generated repo is clean (no dangling refs, no orphans)", () => {
  const cwd = fresh();
  try {
    const { dangling, orphans } = checkDocCoherence(cwd, CONFIG);
    assert.deepEqual(dangling, []);
    assert.deepEqual(orphans, []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("coherence · a dangling relative reference is flagged", () => {
  const cwd = fresh();
  try {
    mkdirSync(resolve(cwd, "docs/project"), { recursive: true });
    writeFileSync(resolve(cwd, "docs/project/guide.md"), "See [missing](./nope.md) for details.");
    const { dangling } = checkDocCoherence(cwd, CONFIG);
    assert.ok(dangling.some((d) => d.file === "docs/project/guide.md" && d.target === "./nope.md"));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("coherence · orphan flagged; linked + whitelisted basenames are not", () => {
  const cwd = fresh();
  try {
    // Root README is a scanned link source → linking a doc from it keeps it out of the orphan set.
    writeFileSync(resolve(cwd, "README.md"), "# Root\nSee the [guide](docs/project/linked.md).");
    mkdirSync(resolve(cwd, "docs/project"), { recursive: true });
    writeFileSync(resolve(cwd, "docs/project/linked.md"), "linked content");
    writeFileSync(resolve(cwd, "docs/project/stray.md"), "nobody links me");
    writeFileSync(resolve(cwd, "docs/project/README.md"), "whitelisted basename");
    const { orphans } = checkDocCoherence(cwd, CONFIG);
    assert.ok(orphans.includes("docs/project/stray.md"), "unlinked doc is an orphan");
    assert.ok(!orphans.includes("docs/project/linked.md"), "linked doc is not an orphan");
    assert.ok(!orphans.includes("docs/project/README.md"), "README basename is whitelisted");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
