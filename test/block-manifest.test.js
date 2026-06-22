import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { composeFromManifest } from "../dist/generate/agents.js";
import { BLOCK_MANIFEST } from "../dist/generate/blockManifest.js";
import { aiwsBlockId } from "../dist/generate/naming.js";

// PR1 (0008): composeBlocks now walks a declarative BLOCK_MANIFEST. These tests pin the two guarantees
// the refactor must hold: (1) byte-equivalence — the generated AGENTS.md is identical to the baseline
// captured from the pre-refactor implementation; (2) extensibility — adding a manifest entry yields a
// block in the declared position, with no change to the compositor. See spec.md / design.md.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-bm-"));
}

// Mirror of the cases captured in test/__fixtures__/agents/*.md (see capture in design.md).
const CASES = {
  minimal: { project: { name: "t" } },
  learn: { project: { name: "t", purpose: "learn" } },
  "example-reasons-odoo": { project: { name: "t", mode: "new" }, company: "example", sdd: { schema: "reasons" }, stack: { environments: [{ id: "odoo", version: "latest" }] } },
  "example-fullstack": { project: { name: "t" }, company: "example", stack: { languages: [{ id: "typescript", version: "latest" }, { id: "go", version: "latest" }], frameworks: [{ id: "react", version: "latest" }], environments: [{ id: "wsl", version: "latest" }, { id: "docker", version: "latest" }] } },
  "no-features": { project: { name: "t" }, sdd: { enabled: false }, livingDocs: false },
};

test("manifest · AGENTS.md is byte-identical to the captured baseline (R2/E1)", () => {
  for (const [name, raw] of Object.entries(CASES)) {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse(raw));
      const got = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
      const expected = readFileSync(resolve(root, "test/__fixtures__/agents", `${name}.md`), "utf8");
      assert.equal(got, expected, `byte drift in ${name}`);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test("manifest · block order is a pure function of the manifest (R1/R3)", () => {
  // The ids produced by composeFromManifest equal the manifest's own ids, after gating + expansion.
  const config = ConfigSchema.parse({
    project: { name: "t" },
    company: "example",
    stack: { languages: [{ id: "typescript", version: "latest" }], frameworks: [{ id: "react", version: "latest" }] },
  });
  // composeFromManifest namespaces every id to `aiws:*` (ADR 0003 F1b); mirror that here.
  const expected = [];
  for (const entry of BLOCK_MANIFEST) {
    if (entry.kind === "expand") {
      expected.push(...entry.expand(config).map((b) => aiwsBlockId(b.id)));
    } else if (!entry.when || entry.when(config)) {
      expected.push(aiwsBlockId(entry.id));
    }
  }
  const got = composeFromManifest(config, BLOCK_MANIFEST).map((b) => b.id);
  assert.deepEqual(got, expected);
});

test("manifest · adding one entry yields a block in the declared position (R8/E6)", () => {
  const config = ConfigSchema.parse({ project: { name: "t" } });
  // Inject a probe entry right after `core`, using a derived manifest — composeFromManifest is NOT edited.
  const probe = { kind: "render", id: "probe-block", render: () => "PROBE-CONTENT" };
  const derived = [];
  for (const entry of BLOCK_MANIFEST) {
    derived.push(entry);
    if (entry.kind === "template" && entry.id === "core") derived.push(probe);
  }
  const ids = composeFromManifest(config, derived).map((b) => b.id);
  assert.equal(ids[ids.indexOf(aiwsBlockId("core")) + 1], aiwsBlockId("probe-block"));
  const block = composeFromManifest(config, derived).find((b) => b.id === aiwsBlockId("probe-block"));
  assert.equal(block.content, "PROBE-CONTENT");
});
