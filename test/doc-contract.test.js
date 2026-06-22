import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { resolveDocContract } from "../dist/generate/docContract.js";
import { generate } from "../dist/generate/index.js";

// 0016a R1/R2: the doc-structure contract (defaulted, config-overridable) + the generated docs/INDEX.md mirror.

const CONFIG = ConfigSchema.parse({
  project: { name: "t" },
  stack: { languages: [{ id: "typescript", version: "latest" }] },
});

test("doc-contract · default applies when none configured (root README is the authored index)", () => {
  const c = resolveDocContract(CONFIG);
  assert.ok(c.length > 0);
  assert.ok(
    c.some((e) => e.path === "README.md" && e.owner === "authored"),
    "root README is the declared index",
  );
  assert.ok(c.some((e) => e.path === "docs/README.md" && e.owner === "generated"));
});

test("doc-contract · an explicit contract wins over the default", () => {
  const config = ConfigSchema.parse({
    project: { name: "t" },
    docs: { contract: [{ path: "only.md", owner: "authored" }] },
  });
  const c = resolveDocContract(config);
  assert.equal(c.length, 1);
  assert.equal(c[0].path, "only.md");
});

test("doc-contract · an invalid owner is rejected at parse", () => {
  assert.throws(() =>
    ConfigSchema.parse({ project: { name: "t" }, docs: { contract: [{ path: "x.md", owner: "bogus" }] } }),
  );
});

test("doc-contract · docs/README.md is generated and idempotent (byte-stable on re-run)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-doc-"));
  try {
    generate(cwd, CONFIG);
    const readme = resolve(cwd, "docs/README.md");
    assert.ok(existsSync(readme), "docs/README.md generated");
    const before = readFileSync(readme, "utf8");
    generate(cwd, CONFIG); // second run (writeIfMissing → untouched)
    assert.equal(readFileSync(readme, "utf8"), before, "docs/README.md is byte-stable across runs");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
