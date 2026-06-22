import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema, resolveRepos, unionStack } from "../dist/config/schema.js";
import { generate, agentsImportPath } from "../dist/generate/index.js";

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-multi-"));
}

// 0003 — per-repo generation. A multi-repo config governs >1 linked repo: the root stays canonical
// (AGENTS.md + workflow skills + non-stack packs), each child gets its Claude adapter + stack packs.
const MULTI = {
  project: { name: "workspace" },
  profile: { userType: "technical", experience: "advanced" },
  repos: [
    { path: "app-a", stack: { environments: [{ id: "odoo", version: "latest" }] } },
    { path: "app-b", stack: { frameworks: [{ id: "react", version: "latest" }] } },
  ],
};

test("agentsImportPath resolves the import depth from the repo path", () => {
  assert.equal(agentsImportPath("."), "AGENTS.md");
  assert.equal(agentsImportPath(""), "AGENTS.md");
  assert.equal(agentsImportPath("app-a"), "../AGENTS.md");
  assert.equal(agentsImportPath("./app-a/"), "../AGENTS.md");
  assert.equal(agentsImportPath("x/y"), "../../AGENTS.md");
});

test("unionStack merges + de-dupes every resolved repo's stack", () => {
  const config = ConfigSchema.parse({
    project: { name: "t" },
    stack: { languages: [{ id: "typescript", version: "latest" }] },
    repos: [
      {
        path: "a",
        stack: {
          languages: [{ id: "python", version: "3" }],
          environments: [{ id: "odoo", version: "latest" }],
        },
      },
      {
        path: "b",
        stack: {
          languages: [{ id: "python", version: "3" }],
          frameworks: [{ id: "react", version: "latest" }],
        },
      },
    ],
  });
  const u = unionStack(config).stack;
  assert.deepEqual(
    u.languages.map((l) => l.id),
    ["python"],
  ); // de-duped; root stack only used when repos[] empty
  assert.deepEqual(
    u.frameworks.map((f) => f.id),
    ["react"],
  );
  assert.deepEqual(
    u.environments.map((e) => e.id),
    ["odoo"],
  );
});

test("resolveRepos: empty repos[] is single-repo at '.'; populated lists children only", () => {
  const single = resolveRepos(ConfigSchema.parse({ project: { name: "t" } }));
  assert.deepEqual(
    single.map((r) => r.path),
    ["."],
  );
  const multi = resolveRepos(ConfigSchema.parse(MULTI));
  assert.deepEqual(
    multi.map((r) => r.path),
    ["app-a", "app-b"],
  );
});

test("multi-repo: root is canonical, each child gets its adapter + stack packs", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse(MULTI));

    // Root: canonical AGENTS.md + the CLAUDE.md bridge importing @AGENTS.md.
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:aiws:core/);
    const rootClaude = readFileSync(resolve(cwd, "CLAUDE.md"), "utf8");
    assert.match(rootClaude, /@AGENTS\.md/);
    assert.doesNotMatch(rootClaude, /@\.\.\/AGENTS\.md/);

    // Each child: a CLAUDE.md importing the root via the correct relative path.
    for (const p of ["app-a", "app-b"]) {
      const childClaude = readFileSync(resolve(cwd, p, "CLAUDE.md"), "utf8");
      assert.match(childClaude, /@\.\.\/AGENTS\.md/, `${p} should import ../AGENTS.md`);
    }
    // No second canonical AGENTS.md inside a child.
    assert.equal(existsSync(resolve(cwd, "app-a/AGENTS.md")), false);

    // Stack packs land under the matching child only — never at the root, never cross-repo.
    assert.ok(readFileSync(resolve(cwd, "app-a/.claude/skills/odoo-18.0/SKILL.md"), "utf8"));
    assert.ok(readFileSync(resolve(cwd, "app-b/.claude/skills/frontend-ui-dark-ts/SKILL.md"), "utf8"));
    assert.equal(existsSync(resolve(cwd, ".claude/skills/odoo-18.0/SKILL.md")), false);
    assert.equal(existsSync(resolve(cwd, "app-b/.claude/skills/odoo-18.0/SKILL.md")), false);
    assert.equal(existsSync(resolve(cwd, "app-a/.claude/skills/frontend-ui-dark-ts/SKILL.md")), false);

    // Non-stack workflow/dev packs are workspace-level (root), not duplicated into children.
    assert.ok(readFileSync(resolve(cwd, ".claude/skills/mcp-builder/SKILL.md"), "utf8"));
    assert.equal(existsSync(resolve(cwd, "app-a/.claude/skills/mcp-builder/SKILL.md")), false);
    // SDD workflow skills + commands also live at the root.
    assert.ok(readFileSync(resolve(cwd, ".claude/skills/aiws-configure-workspace/SKILL.md"), "utf8"));

    // Root AGENTS.md skill-routing documents the UNION of both children's stack packs.
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    const routing = agents.slice(agents.indexOf("skill-routing"));
    assert.match(routing, /odoo-18\.0/);
    assert.match(routing, /frontend-ui-dark-ts/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("multi-repo (0005): each child gets a Copilot path-scoped applyTo instruction; single-repo gets none", () => {
  const multi = tmpRepo();
  const single = tmpRepo();
  try {
    generate(multi, ConfigSchema.parse(MULTI));
    // One .github/instructions/<slug>.instructions.md per child, scoped to its path.
    const a = readFileSync(resolve(multi, ".github/instructions/app-a.instructions.md"), "utf8");
    assert.match(a, /applyTo: "app-a\/\*\*"/);
    assert.match(a, /app-a/);
    assert.ok(readFileSync(resolve(multi, ".github/instructions/app-b.instructions.md"), "utf8"));
    // Single-repo: no per-repo instruction (only the TS one when typescript is present).
    generate(
      single,
      ConfigSchema.parse({
        project: { name: "t" },
        stack: { languages: [{ id: "typescript", version: "latest" }] },
      }),
    );
    assert.ok(readFileSync(resolve(single, ".github/instructions/typescript.instructions.md"), "utf8"));
    assert.equal(existsSync(resolve(single, ".github/instructions/app-a.instructions.md")), false);
  } finally {
    rmSync(multi, { recursive: true, force: true });
    rmSync(single, { recursive: true, force: true });
  }
});

test("multi-repo generation is idempotent (second run 0 changed)", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse(MULTI);
    generate(cwd, config);
    const second = generate(cwd, config);
    const changed = second.artifacts.filter((a) => a.status !== "unchanged");
    assert.equal(changed.length, 0, `unexpected changes: ${changed.map((a) => a.path).join(", ")}`);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
