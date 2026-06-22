import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { loadPacks, hasStackBinding } from "../dist/generate/stackPacks.js";

// These tests pin the *stable contracts* the architecture promises in AGENTS.md
// ("managed-region block ids are a stable contract", "idempotency is sacred",
// "binary skill assets ship byte-for-byte"). They are guard-rails: if a refactor
// silently breaks one of these, CI goes red here — the contract is enforced, not
// just documented. See docs/project/decisions/0002-extension-contracts.md.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-inv-"));
}

/** Ordered list of managed block ids as they appear in a generated file. */
function blockOrder(content) {
  const ids = [];
  const re = /<!-- ai-workspace:begin:([a-zA-Z0-9:-]+) -->/g;
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
      "aiws:header",
      "aiws:core",
      "aiws:profile",
      "aiws:versioning",
      "aiws:safety",
      "aiws:workflow",
      "aiws:harness-engineering",
      "aiws:routing",
      "aiws:skill-routing",
      "aiws:lang-typescript",
      "aiws:fw-react",
      "aiws:env-wsl",
      "aiws:company-overlay",
      "aiws:company",
      "aiws:business",
      "aiws:sdd",
      "aiws:living-docs",
    ]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("invariant · tech-selection block is greenfield-gated (new + empty stack only), after skill-routing", () => {
  const make = (raw) => {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse(raw));
      return blockOrder(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  };
  // Greenfield with no stack ⇒ present, immediately after skill-routing.
  const green = make({ project: { name: "g", mode: "new" } });
  assert.ok(green.includes("aiws:tech-selection"), "greenfield empty-stack should include tech-selection");
  assert.equal(
    green[green.indexOf("aiws:skill-routing") + 1],
    "aiws:tech-selection",
    "tech-selection must follow skill-routing",
  );
  // Existing project ⇒ absent.
  assert.ok(
    !make({ project: { name: "e", mode: "existing" } }).includes("aiws:tech-selection"),
    "existing repo must not get tech-selection",
  );
  // New project that already chose a stack ⇒ absent (no nagging).
  const configured = make({
    project: { name: "c", mode: "new" },
    stack: { languages: [{ id: "typescript", version: "latest" }] },
  });
  assert.ok(
    !configured.includes("aiws:tech-selection"),
    "a configured greenfield repo must not get tech-selection",
  );
});

test("invariant · the Layer-0 core prefix is fixed and config-independent", () => {
  // Whatever the stack/company/features, the first eight blocks never move:
  // they are the governance spine every downstream repo relies on.
  const prefix = [
    "aiws:header",
    "aiws:core",
    "aiws:profile",
    "aiws:versioning",
    "aiws:safety",
    "aiws:workflow",
    "aiws:harness-engineering",
    "aiws:routing",
    "aiws:skill-routing",
  ];
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
    {
      project: { name: "ex", mode: "new" },
      company: "example",
      sdd: { schema: "reasons" },
      stack: { environments: [{ id: "odoo", version: "latest" }] },
    },
    {
      project: { name: "ex2" },
      company: "example",
      profile: { userType: "business", experience: "beginner" },
    },
    { project: { name: "claude-only" }, targets: ["claude"] },
    { project: { name: "copilot-only" }, targets: ["copilot"] },
  ];
  for (const raw of matrix) {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse(raw));
      const second = generate(cwd, ConfigSchema.parse(raw));
      const changed = second.artifacts.filter((a) => a.status !== "unchanged");
      assert.equal(
        changed.length,
        0,
        `${raw.project.name}: unexpected changes → ${changed.map((a) => `${a.path}:${a.status}`).join(", ")}`,
      );
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
    const marker = "<!-- ai-workspace:end:aiws:core -->";
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
    assert.match(after, /ai-workspace:begin:aiws:core/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// ── Contract: generated commands use the reserved aiws- namespace (0013 F1a.2) ──
// Every generated slash command / prompt must be /aiws-*. This guard scans ALL
// generated markdown/json and fails on any legacy command token, catching missed
// prose references during the rename. `/aiws-sdd-explore` does not contain `/sdd-`,
// so aiws-prefixed commands never false-trigger.

test("invariant · generated output carries no legacy command tokens (aiws- namespace)", () => {
  const cwd = tmpRepo();
  try {
    // Maximal-ish config: SDD + living docs + learn + governance + stack layers.
    generate(
      cwd,
      ConfigSchema.parse({
        project: { name: "t", purpose: "learn" },
        company: "example",
        stack: {
          languages: [{ id: "typescript", version: "latest" }],
          frameworks: [{ id: "react", version: "latest" }],
          environments: [{ id: "docker", version: "latest" }],
        },
      }),
    );
    // Match only actual legacy command names (the negative lookahead avoids file paths like
    // `_shared/aiws-sdd-convention.md` or `.githooks/commit-msg`).
    const legacy = [
      /\/sdd-(explore|propose|clarify|spec|design|tasks|apply|verify|archive|constitution|sync)(?![-\w])/,
      /\/doc-sync(?![-\w])/,
      /\/commit(?![-\w])/,
      /\/upgrade-deps(?![-\w])/,
      /\/configure(?![-\w])/,
      /\/learn(?![-\w])/,
    ];
    for (const rel of readdirSync(cwd, { recursive: true })) {
      const p = resolve(cwd, rel.toString());
      if (!/\.(md|json)$/.test(p)) continue;
      let txt;
      try {
        txt = readFileSync(p, "utf8");
      } catch {
        continue; // directory entry
      }
      for (const re of legacy) {
        assert.doesNotMatch(txt, re, `legacy command token ${re} in ${rel}`);
      }
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// ── Contract: authored base packs live in the reserved aiws- namespace (0014 F2a) ──
// `aiws-` marks artifacts WE author. A bundled pack must therefore be either namespaced, a vendored
// upstream pack (`base:` — keeps its ecosystem id so `skills sync` maps it + attribution is honest), or a
// stack pack (stack-bound — keyed to a real technology, legitimately overridable). A future authored pack
// that forgets the prefix fails here. The runtime impersonation guard (reject external aiws-) lands in F2c.

test("invariant · every authored, non-stack bundled pack is in the aiws- namespace", () => {
  const offenders = [];
  for (const { manifest } of loadPacks()) {
    const exempt = manifest.id.startsWith("aiws-") || Boolean(manifest.base) || hasStackBinding(manifest);
    if (!exempt) offenders.push(manifest.id);
  }
  assert.deepEqual(offenders, [], `authored base packs missing the aiws- prefix: ${offenders.join(", ")}`);
});

// ── Contract 3: binary skill assets ship byte-for-byte ──────────────────────
// The engine routes binaries (logos, .pptx/.dotx) through a byte writer, never
// the utf8 text writer. No binary assets ship in this public repo's skill-packs,
// so there is nothing to assert here; the behavior is covered by package.ts and
// stackPacks.ts (BINARY_ASSET) and re-add a case if a binary pack is introduced.
