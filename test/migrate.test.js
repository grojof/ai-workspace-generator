import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { migrateBlockIds, pruneRenamedOrphans } from "../dist/commands/migrate.js";

// ADR 0003 F1b.2: `ai-workspace upgrade` migrates a pre-namespace repo to the `aiws` namespace.
// These tests pin the two migration steps and their idempotency, plus the guards that keep them from
// touching user content or still-generated artifacts.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-mig-"));
}

const CONFIG = ConfigSchema.parse({
  project: { name: "t" },
  company: "example",
  stack: { languages: [{ id: "typescript", version: "latest" }], environments: [{ id: "wsl", version: "latest" }] },
});

/** Downgrade a freshly generated repo to the legacy bare-id layout the migration must heal. */
function legacyize(cwd) {
  for (const rel of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"]) {
    const abs = resolve(cwd, rel);
    if (!existsSync(abs)) continue;
    const bare = readFileSync(abs, "utf8")
      .split(":begin:aiws:").join(":begin:")
      .split(":end:aiws:").join(":end:");
    writeFileSync(abs, bare, "utf8");
  }
}

test("migrate · block ids: legacy bare spine markers are namespaced in place, user prose survives", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, CONFIG);
    // Add out-of-band user prose, then downgrade to the legacy layout.
    const agentsPath = resolve(cwd, "AGENTS.md");
    writeFileSync(agentsPath, "USER-PREAMBLE\n\n" + readFileSync(agentsPath, "utf8") + "\n\nUSER-EPILOGUE\n");
    legacyize(cwd);
    assert.match(readFileSync(agentsPath, "utf8"), /<!-- ai-workspace:begin:core -->/);

    const changes = migrateBlockIds(cwd, CONFIG);
    assert.ok(changes.length > 0, "should report migrated files");
    assert.ok(changes.some((c) => c.file === "AGENTS.md" && c.count > 0));

    const agents = readFileSync(agentsPath, "utf8");
    assert.match(agents, /<!-- ai-workspace:begin:aiws:core -->/);
    assert.match(agents, /<!-- ai-workspace:end:aiws:core -->/);
    // No bare spine marker left behind.
    assert.doesNotMatch(agents, /<!-- ai-workspace:begin:core -->/);
    assert.doesNotMatch(agents, /<!-- ai-workspace:begin:lang-typescript -->/);
    // User prose preserved.
    assert.match(agents, /USER-PREAMBLE/);
    assert.match(agents, /USER-EPILOGUE/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("migrate · block ids: idempotent, and a re-generate appends no duplicates (0 orphans)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, CONFIG);
    legacyize(cwd);
    migrateBlockIds(cwd, CONFIG);

    // Second migration is a no-op.
    assert.deepEqual(migrateBlockIds(cwd, CONFIG), []);

    // Re-generate updates the migrated regions in place (no duplicate aiws:core block appended).
    const { artifacts } = generate(cwd, CONFIG);
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const coreBegins = (agents.match(/<!-- ai-workspace:begin:aiws:core -->/g) || []).length;
    assert.equal(coreBegins, 1, "exactly one aiws:core block after re-generate");
    assert.equal(artifacts.filter((a) => a.path === "AGENTS.md" && a.status === "created").length, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("migrate · prune: legacy renamed skill folders + command files are removed, aiws + user + packs kept", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, CONFIG);
    // Simulate leftovers from the pre-aiws layout (F1a rename): a bare skill folder and a bare command.
    cpSync(resolve(cwd, ".claude/skills/aiws-secure-commit"), resolve(cwd, ".claude/skills/secure-commit"), { recursive: true });
    cpSync(resolve(cwd, ".claude/commands/aiws-sdd-explore.md"), resolve(cwd, ".claude/commands/sdd-explore.md"));
    // A shared reference that gained the aiws- prefix (e.g. _shared/sdd-convention.md → aiws-sdd-convention.md).
    writeFileSync(resolve(cwd, ".claude/skills/_shared/sdd-convention.md"), "legacy convention");
    // A user-authored skill that is NOT an aiws- sibling must never be touched.
    mkdirSync(resolve(cwd, ".claude/skills/my-custom"), { recursive: true });
    writeFileSync(resolve(cwd, ".claude/skills/my-custom/SKILL.md"), "custom");

    const { artifacts } = generate(cwd, CONFIG);
    const removed = pruneRenamedOrphans(cwd, artifacts.map((a) => a.path));

    assert.ok(removed.includes(".claude/skills/secure-commit/"), "legacy skill folder removed");
    assert.ok(removed.includes(".claude/commands/sdd-explore.md"), "legacy command removed");
    assert.ok(removed.includes(".claude/skills/_shared/sdd-convention.md"), "legacy _shared reference removed");
    assert.equal(existsSync(resolve(cwd, ".claude/skills/_shared/sdd-convention.md")), false);
    assert.ok(existsSync(resolve(cwd, ".claude/skills/_shared/aiws-sdd-convention.md")), "renamed _shared reference kept");
    assert.equal(existsSync(resolve(cwd, ".claude/skills/secure-commit")), false);
    assert.equal(existsSync(resolve(cwd, ".claude/commands/sdd-explore.md")), false);
    // Kept: the namespaced replacement, the user skill, and an un-renamed pack skill.
    assert.ok(existsSync(resolve(cwd, ".claude/skills/aiws-secure-commit/SKILL.md")));
    assert.ok(existsSync(resolve(cwd, ".claude/skills/my-custom/SKILL.md")));
    assert.ok(existsSync(resolve(cwd, ".claude/skills/find-skills")), "un-renamed pack untouched");

    // Idempotent: nothing left to prune.
    assert.deepEqual(pruneRenamedOrphans(cwd, generate(cwd, CONFIG).artifacts.map((a) => a.path)), []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
