import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// These tests pin the *stable contracts* the architecture promises in AGENTS.md
// ("managed-region block ids are a stable contract", "idempotency is sacred",
// "binary skill assets ship byte-for-byte"). They are guard-rails: if a refactor
// silently breaks one of these, CI goes red here — the contract is enforced, not
// just documented. See docs/project/decisions/0002-extension-contracts.md.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-inv-"));
}

/** Ordered list of managed block ids as they appear in a generated file. */
function blockOrder(content) {
  const ids = [];
  const re = /<!-- ai-workspace:begin:([a-zA-Z0-9-]+) -->/g;
  let m;
  while ((m = re.exec(content))) ids.push(m[1]);
  return ids;
}

// ── Contract 1: block order + ids are a stable contract ─────────────────────
// Renaming, removing, reordering or accidentally inserting a block id orphans
// content in users' repos (writeManaged never deletes unknown blocks). This
// golden pins the full ordered sequence for a maximal (non-learn) config.

test("invariant · AGENTS.md block order is a stable contract (golden)", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({
      project: { name: "t", mode: "new", purpose: "build" },
      company: "example",
      stack: {
        languages: [{ id: "typescript", version: "latest" }],
        frameworks: [{ id: "react", version: "latest" }],
        environments: [{ id: "wsl", version: "latest" }],
      },
    });
    generate(cwd, config);
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.deepEqual(blockOrder(agents), [
      "header",
      "core",
      "profile",
      "versioning",
      "safety",
      "workflow",
      "harness-engineering",
      "routing",
      "skill-routing",
      "lang-typescript",
      "fw-react",
      "env-wsl",
      "company-overlay",
      "company",
      "business",
      "sdd",
      "living-docs",
    ]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("invariant · the Layer-0 core prefix is fixed and config-independent", () => {
  // Whatever the stack/company/features, the first eight blocks never move:
  // they are the governance spine every downstream repo relies on.
  const prefix = ["header", "core", "profile", "versioning", "safety", "workflow", "harness-engineering", "routing", "skill-routing"];
  const configs = [
    { project: { name: "a" } },
    { project: { name: "b", purpose: "learn" } },
    { project: { name: "c" }, company: "example", sdd: { enabled: false }, livingDocs: false },
  ];
  for (const raw of configs) {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse(raw));
      const order = blockOrder(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"));
      assert.deepEqual(order.slice(0, prefix.length), prefix, `prefix drifted for ${JSON.stringify(raw)}`);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test("invariant · every managed block id is unique (no accidental double-push)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, company: "example" }));
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const ids = blockOrder(agents);
    assert.equal(new Set(ids).size, ids.length, `duplicate block id(s): ${ids.join(", ")}`);
    // Every begin marker has a matching end marker.
    for (const id of ids) {
      assert.match(agents, new RegExp(`<!-- ai-workspace:end:${id} -->`), `block ${id} has no end marker`);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// ── Contract 2: idempotency is sacred ───────────────────────────────────────
// A second generate must report 0 created / 0 updated across the config space.

test("invariant · second generate is idempotent across representative configs", () => {
  const matrix = [
    { project: { name: "min" } },
    { project: { name: "learn", purpose: "learn" } },
    { project: { name: "ex", mode: "new" }, company: "example", sdd: { schema: "reasons" }, stack: { environments: [{ id: "odoo", version: "latest" }] } },
    { project: { name: "ex2" }, company: "example", profile: { userType: "business", experience: "beginner" } },
    { project: { name: "claude-only" }, targets: ["claude"] },
    { project: { name: "copilot-only" }, targets: ["copilot"] },
  ];
  for (const raw of matrix) {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse(raw));
      const second = generate(cwd, ConfigSchema.parse(raw));
      const changed = second.artifacts.filter((a) => a.status !== "unchanged");
      assert.equal(changed.length, 0, `${raw.project.name}: unexpected changes → ${changed.map((a) => `${a.path}:${a.status}`).join(", ")}`);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test("invariant · user text outside managed markers survives regeneration", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" } });
    generate(cwd, config);
    const path = resolve(cwd, "AGENTS.md");
    const original = readFileSync(path, "utf8");
    // Inject prose at the very top, between two blocks, and at EOF.
    const marker = "<!-- ai-workspace:end:core -->";
    const tampered =
      "MANUAL-TOP-NOTE\n\n" +
      original.replace(marker, `${marker}\n\nMANUAL-MIDDLE-NOTE\n`) +
      "\n\nMANUAL-EOF-NOTE\n";
    writeFileSync(path, tampered);
    generate(cwd, config);
    const after = readFileSync(path, "utf8");
    for (const note of ["MANUAL-TOP-NOTE", "MANUAL-MIDDLE-NOTE", "MANUAL-EOF-NOTE"]) {
      assert.match(after, new RegExp(note), `lost out-of-band note: ${note}`);
    }
    // Blocks still intact after the round-trip.
    assert.match(after, /ai-workspace:begin:core/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// ── Contract 3: binary skill assets ship byte-for-byte ──────────────────────
// The engine routes binaries (logos, .pptx/.dotx) through a byte writer, never
// the utf8 text writer. No binary assets ship in this public repo's skill-packs,
// so there is nothing to assert here; the behavior is covered by package.ts and
// stackPacks.ts (BINARY_ASSET) and re-add a case if a binary pack is introduced.
