import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";
import { runPackage } from "../dist/commands/package.js";
import { diffTrees, hashTree } from "../dist/commands/skillsSync.js";

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-test-"));
}

test("generate creates AGENTS.md with governance blocks", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({
      project: { name: "t", mode: "new" },
      stack: { languages: [{ id: "typescript", version: "5" }] },
    });
    generate(cwd, config);
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    for (const id of ["header", "core", "versioning", "safety", "workflow", "lang-typescript"]) {
      assert.match(agents, new RegExp(`ai-workspace:begin:${id}`), `missing block ${id}`);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("harness-engineering is an always-on Layer-0 principle with the ratchet rule", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const agents = readFileSync(resolve(cwd, "AGENTS.md"), "utf8");
    assert.match(agents, /ai-workspace:begin:harness-engineering/);
    assert.match(agents, /Harness engineering \(Layer 0\)/);
    // The ratchet principle: rules trace to observed failures; fix the harness, not more prose.
    assert.match(agents, /ratchet principle/i);
    assert.match(agents, /what failure does this prevent/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("second generate is fully idempotent", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" } });
    generate(cwd, config);
    const second = generate(cwd, config);
    const changed = second.artifacts.filter((a) => a.status !== "unchanged");
    assert.equal(changed.length, 0, `unexpected changes: ${changed.map((a) => a.path).join(", ")}`);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("AI artifacts are English-only; human docs follow config.language", () => {
  const es = tmpRepo();
  const en = tmpRepo();
  try {
    generate(es, ConfigSchema.parse({ project: { name: "t" }, language: "es" }));
    generate(en, ConfigSchema.parse({ project: { name: "t" }, language: "en" }));
    // AGENTS.md (AI-facing) is English regardless of config.language.
    assert.match(readFileSync(resolve(es, "AGENTS.md"), "utf8"), /Universal conventions/);
    assert.match(readFileSync(resolve(en, "AGENTS.md"), "utf8"), /Universal conventions/);
    // AI-WORKSPACE.md (human onboarding) follows config.language.
    assert.match(readFileSync(resolve(es, "AI-WORKSPACE.md"), "utf8"), /Workspace de IA/);
    assert.match(readFileSync(resolve(en, "AI-WORKSPACE.md"), "utf8"), /AI Workspace/);
  } finally {
    rmSync(es, { recursive: true, force: true });
    rmSync(en, { recursive: true, force: true });
  }
});

test("learn purpose generates the tutor skill and learning block", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t", purpose: "learn" } }));
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:learning/);
    assert.ok(readFileSync(resolve(cwd, ".claude/skills/learn/SKILL.md"), "utf8"));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("profile block renders only the active governance posture", () => {
  const biz = tmpRepo();
  const tech = tmpRepo();
  try {
    generate(biz, ConfigSchema.parse({ project: { name: "t" }, language: "en", profile: { userType: "business", experience: "beginner" } }));
    generate(tech, ConfigSchema.parse({ project: { name: "t" }, language: "en", profile: { userType: "technical", experience: "advanced" } }));
    const bizAgents = readFileSync(resolve(biz, "AGENTS.md"), "utf8");
    const techAgents = readFileSync(resolve(tech, "AGENTS.md"), "utf8");
    // Block exists in both.
    assert.match(bizAgents, /ai-workspace:begin:profile/);
    assert.match(techAgents, /ai-workspace:begin:profile/);
    // Only the active combination is emitted (no cross-contamination).
    assert.match(bizAgents, /Active profile: \*\*business\*\* . \*\*beginner\*\*/);
    assert.match(bizAgents, /guided flows/i);
    assert.doesNotMatch(bizAgents, /trade-offs/i);
    assert.match(techAgents, /Active profile: \*\*technical\*\* . \*\*advanced\*\*/);
    assert.match(techAgents, /trade-offs/i);
    assert.doesNotMatch(techAgents, /guided flows/i);
  } finally {
    rmSync(biz, { recursive: true, force: true });
    rmSync(tech, { recursive: true, force: true });
  }
});

test("profile defaults to technical/standard when unspecified", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" } });
    assert.equal(config.profile.userType, "technical");
    assert.equal(config.profile.experience, "standard");
    generate(cwd, config);
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:profile/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("environment modules render a block", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, stack: { environments: [{ id: "wsl", version: "latest" }] } }));
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /ai-workspace:begin:env-wsl/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("docs layout uses stable English folders (development/specs/changes/status)", () => {
  const es = tmpRepo();
  const en = tmpRepo();
  try {
    generate(es, ConfigSchema.parse({ project: { name: "t", mode: "new" }, language: "es" }));
    generate(en, ConfigSchema.parse({ project: { name: "t", mode: "new" }, language: "en" }));
    // Folder names are identical regardless of content language.
    assert.ok(readFileSync(resolve(es, "docs/development/README.md"), "utf8"));
    assert.ok(readFileSync(resolve(en, "docs/development/README.md"), "utf8"));
    assert.ok(readFileSync(resolve(es, "docs/development/status/PROJECT-STATE.md"), "utf8"));
    const esAgents = readFileSync(resolve(es, "AGENTS.md"), "utf8");
    assert.match(esAgents, /docs\/development\/changes/);
    assert.doesNotMatch(esAgents, /openspec\//);
    assert.doesNotMatch(esAgents, /docs\/ai\//);
  } finally {
    rmSync(es, { recursive: true, force: true });
    rmSync(en, { recursive: true, force: true });
  }
});

test("docs.development overrides the development root", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t", mode: "new" }, language: "en", docs: { development: "dev" } }));
    assert.ok(readFileSync(resolve(cwd, "dev/README.md"), "utf8"));
    assert.ok(readFileSync(resolve(cwd, "dev/status/PROJECT-STATE.md"), "utf8"));
    assert.match(readFileSync(resolve(cwd, "AGENTS.md"), "utf8"), /dev\/changes/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("skill-routing block is profile-filtered", () => {
  const biz = tmpRepo();
  const tech = tmpRepo();
  try {
    generate(biz, ConfigSchema.parse({ project: { name: "t" }, language: "en", profile: { userType: "business", experience: "standard" } }));
    generate(tech, ConfigSchema.parse({ project: { name: "t" }, language: "en", profile: { userType: "technical", experience: "standard" } }));
    const blockOf = (s) => s.match(/begin:skill-routing[\s\S]*?end:skill-routing/)[0];
    const bizBlock = blockOf(readFileSync(resolve(biz, "AGENTS.md"), "utf8"));
    const techBlock = blockOf(readFileSync(resolve(tech, "AGENTS.md"), "utf8"));
    // secure-commit (userType both) appears for everyone.
    assert.match(bizBlock, /secure-commit/);
    // dependency-upgrade is technical-only: hidden for business, shown for technical.
    assert.doesNotMatch(bizBlock, /dependency-upgrade/);
    assert.match(techBlock, /dependency-upgrade/);
  } finally {
    rmSync(biz, { recursive: true, force: true });
    rmSync(tech, { recursive: true, force: true });
  }
});

test("company overlay renders the selected organization (or none)", () => {
  const example = tmpRepo();
  const none = tmpRepo();
  try {
    generate(example, ConfigSchema.parse({ project: { name: "t" }, company: "example" }));
    generate(none, ConfigSchema.parse({ project: { name: "t" } }));
    const eA = readFileSync(resolve(example, "AGENTS.md"), "utf8");
    const nA = readFileSync(resolve(none, "AGENTS.md"), "utf8");
    assert.match(eA, /ai-workspace:begin:company-overlay/);
    assert.match(eA, /Example Co/);
    assert.match(eA, /Operational Excellence/);
    // none → no overlay block.
    assert.doesNotMatch(nA, /ai-workspace:begin:company-overlay/);
  } finally {
    rmSync(example, { recursive: true, force: true });
    rmSync(none, { recursive: true, force: true });
  }
});

test("reasons schema mode generates the spec-schema skill + routing; lean does not", () => {
  const reasons = tmpRepo();
  const lean = tmpRepo();
  try {
    generate(reasons, ConfigSchema.parse({ project: { name: "t" }, sdd: { schema: "reasons" } }));
    generate(lean, ConfigSchema.parse({ project: { name: "t" } }));
    // reasons → schema + onboarding skills exist + AGENTS.md routes to them.
    assert.ok(readFileSync(resolve(reasons, ".claude/skills/sdd-spec-schema/SKILL.md"), "utf8"));
    assert.ok(readFileSync(resolve(reasons, ".claude/skills/sdd-onboarding/SKILL.md"), "utf8"));
    assert.match(readFileSync(resolve(reasons, "AGENTS.md"), "utf8"), /REASONS Canvas/);
    assert.match(readFileSync(resolve(reasons, "AGENTS.md"), "utf8"), /sdd-onboarding/);
    // lean → no reasons skills, no REASONS routing.
    assert.equal(existsSync(resolve(lean, ".claude/skills/sdd-spec-schema/SKILL.md")), false);
    assert.equal(existsSync(resolve(lean, ".claude/skills/sdd-onboarding/SKILL.md")), false);
    assert.doesNotMatch(readFileSync(resolve(lean, "AGENTS.md"), "utf8"), /REASONS Canvas/);
    // reasons → reviewer audit skills exist; lean → not.
    for (const a of ["security", "style", "stack", "architecture"]) {
      assert.ok(readFileSync(resolve(reasons, `.claude/skills/sdd-audit-${a}/SKILL.md`), "utf8"));
      assert.equal(existsSync(resolve(lean, `.claude/skills/sdd-audit-${a}/SKILL.md`)), false);
    }
    // reasons → builder workflow + reverse-engineering skills exist; lean → not.
    for (const b of ["sdd-init", "sdd-spec-capture", "sdd-spec-review", "sdd-code-generation", "sdd-code-maintenance", "sdd-test-generation", "sdd-self-review", "sdd-handoff", "sdd-reverse-engineering", "sdd-migrate"]) {
      assert.ok(readFileSync(resolve(reasons, `.claude/skills/${b}/SKILL.md`), "utf8"));
      assert.equal(existsSync(resolve(lean, `.claude/skills/${b}/SKILL.md`)), false);
    }
    assert.match(readFileSync(resolve(reasons, "AGENTS.md"), "utf8"), /sdd-spec-capture/);
    // reasons → the spec lifecycle is documented and routed.
    assert.match(readFileSync(resolve(reasons, "AGENTS.md"), "utf8"), /status.*draft.*user-reviewed.*it-approved/);
    assert.match(readFileSync(resolve(reasons, ".claude/skills/sdd-spec-schema/SKILL.md"), "utf8"), /Lifecycle/);
  } finally {
    rmSync(reasons, { recursive: true, force: true });
    rmSync(lean, { recursive: true, force: true });
  }
});

test("package builds a plugin + marketplace + org-skill zips; idempotent and valid zip", () => {
  const cwd = tmpRepo();
  try {
    writeFileSync(join(cwd, "workspace.config.yaml"), "project:\n  name: Acme Portal\ncompany: example\nsdd:\n  schema: reasons\n");
    runPackage(cwd);
    // umbrella plugin + private marketplace exist with the expected identifiers.
    assert.ok(existsSync(resolve(cwd, "plugins/acme-portal/.claude-plugin/plugin.json")));
    const mkt = JSON.parse(readFileSync(resolve(cwd, ".claude-plugin/marketplace.json"), "utf8"));
    assert.equal(mkt.name, "example-tools");
    assert.equal(mkt.plugins[0].name, "acme-portal");
    assert.equal(mkt.metadata.pluginRoot, "./plugins");
    // skills + commands are projected into the plugin.
    assert.ok(existsSync(resolve(cwd, "plugins/acme-portal/skills/living-docs/SKILL.md")));
    assert.ok(existsSync(resolve(cwd, "plugins/acme-portal/commands/commit.md")));
    // per-skill org zips staged, SKILL.md at the zip root (local-file-header name follows the signature).
    const zipPath = resolve(cwd, "dist/org-skills/living-docs.zip");
    assert.ok(existsSync(zipPath));
    const buf = readFileSync(zipPath);
    assert.equal(buf.readUInt32LE(0), 0x04034b50); // first local file header
    const nameLen = buf.readUInt16LE(26);
    assert.equal(buf.slice(30, 30 + nameLen).toString("utf8"), "SKILL.md");
    assert.ok(existsSync(resolve(cwd, "dist/INSTALL.md")));
    // idempotency: a second package writes nothing new (deterministic output).
    const before = readdirSync(resolve(cwd, "dist/org-skills")).length;
    const buf1 = readFileSync(zipPath);
    runPackage(cwd);
    assert.equal(readdirSync(resolve(cwd, "dist/org-skills")).length, before);
    assert.ok(readFileSync(zipPath).equals(buf1));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("distribution config sets a stable org plugin name/owner", () => {
  const cwd = tmpRepo();
  try {
    writeFileSync(
      join(cwd, "workspace.config.yaml"),
      "project:\n  name: Some Client Repo\ncompany: example\ndistribution:\n  plugin: acme-ai-workspace\n  marketplace: acme-tools\n  owner: Acme IT\n",
    );
    runPackage(cwd);
    // The plugin folder + marketplace use the configured names, not the repo name.
    assert.ok(existsSync(resolve(cwd, "plugins/acme-ai-workspace/.claude-plugin/plugin.json")));
    const plug = JSON.parse(readFileSync(resolve(cwd, "plugins/acme-ai-workspace/.claude-plugin/plugin.json"), "utf8"));
    assert.equal(plug.name, "acme-ai-workspace");
    assert.equal(plug.author.name, "Acme IT");
    const mkt = JSON.parse(readFileSync(resolve(cwd, ".claude-plugin/marketplace.json"), "utf8"));
    assert.equal(mkt.name, "acme-tools");
    assert.equal(mkt.plugins[0].name, "acme-ai-workspace");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("stack packs (0004/0005): framework-bound vs technical opt-in gating (experience does not gate)", () => {
  const reactAdv = tmpRepo();
  const reactStd = tmpRepo();
  const plain = tmpRepo();
  try {
    const tech = (experience, stack) => ({ project: { name: "t" }, profile: { userType: "technical", experience }, stack });
    generate(reactAdv, ConfigSchema.parse(tech("advanced", { frameworks: [{ id: "react", version: "latest" }] })));
    generate(reactStd, ConfigSchema.parse(tech("standard", { frameworks: [{ id: "react", version: "latest" }] })));
    generate(plain, ConfigSchema.parse(tech("advanced", {})));
    const has = (d, id) => existsSync(resolve(d, ".claude/skills", id, "SKILL.md"));
    // react framework → the frontend stack packs (incl. references), regardless of experience level.
    for (const d of [reactAdv, reactStd]) {
      for (const id of ["frontend-ui-dark-ts", "frontend-design", "webapp-testing"]) assert.ok(has(d, id));
    }
    assert.ok(readFileSync(resolve(reactAdv, ".claude/skills/frontend-ui-dark-ts/references/components.md"), "utf8"));
    // Apache-2.0 skills retain their LICENSE.txt when shipped (license-retention compliance).
    assert.ok(existsSync(resolve(reactAdv, ".claude/skills/frontend-design/LICENSE.txt")));
    // Opt-in dev tooling (no stack binding): available to ANY technical profile — experience does not gate.
    for (const id of ["find-skills", "skill-creator", "mcp-builder"]) {
      for (const d of [reactAdv, reactStd, plain]) assert.ok(has(d, id));
    }
    // no stack → no stack-bound packs.
    assert.equal(has(plain, "frontend-ui-dark-ts"), false);
  } finally {
    for (const d of [reactAdv, reactStd, plain]) rmSync(d, { recursive: true, force: true });
  }
});

test("config.skills (0006): explicit list filters the library; empty = all; feature bundles unaffected", () => {
  const all = tmpRepo();
  const picked = tmpRepo();
  const feat = tmpRepo();
  try {
    const base = { project: { name: "t" }, profile: { userType: "technical", experience: "advanced" }, stack: { environments: [{ id: "odoo", version: "latest" }] } };
    generate(all, ConfigSchema.parse(base)); // skills:[] → every available library pack
    generate(picked, ConfigSchema.parse({ ...base, skills: ["odoo-18.0"] }));
    generate(feat, ConfigSchema.parse({ ...base, sdd: { schema: "reasons" }, skills: ["odoo-18.0"] }));
    const has = (d, id) => existsSync(resolve(d, ".claude/skills", id, "SKILL.md"));
    // empty list → all library packs present (odoo + advanced opt-in tooling).
    for (const id of ["odoo-18.0", "mcp-builder", "skill-creator", "find-skills"]) assert.ok(has(all, id));
    // explicit list → only the chosen library pack; the other library packs are dropped.
    assert.ok(has(picked, "odoo-18.0"));
    for (const id of ["mcp-builder", "skill-creator", "find-skills"]) assert.equal(has(picked, id), false);
    // feature bundles (sdd-*, routing:false) are governed by their flags, NOT the explicit list.
    assert.ok(has(feat, "sdd-spec-schema"));
    assert.equal(has(feat, "mcp-builder"), false);
  } finally {
    for (const d of [all, picked, feat]) rmSync(d, { recursive: true, force: true });
  }
});

test("skills sync: diffTrees classifies add/change/remove; hashTree ignores CRLF/LF noise", () => {
  const oldT = new Map([["a", "1"], ["b", "2"], ["c", "3"]]);
  const newT = new Map([["a", "1"], ["b", "9"], ["d", "4"]]);
  const d = diffTrees(oldT, newT);
  assert.deepEqual(d.added, ["d"]);
  assert.deepEqual(d.changed, ["b"]);
  assert.deepEqual(d.removed, ["c"]);
  // hashTree normalizes line endings: same content with CRLF vs LF hashes identically.
  const crlf = tmpRepo();
  const lf = tmpRepo();
  try {
    writeFileSync(join(crlf, "SKILL.md"), "line1\r\nline2\r\n");
    writeFileSync(join(lf, "SKILL.md"), "line1\nline2\n");
    assert.equal(hashTree(crlf).get("SKILL.md"), hashTree(lf).get("SKILL.md"));
  } finally {
    rmSync(crlf, { recursive: true, force: true });
    rmSync(lf, { recursive: true, force: true });
  }
});

test("stack packs: a bound pack (odoo) is copied for technical; gated by stack + profile; idempotent", () => {
  const odoo = tmpRepo();
  const plain = tmpRepo();
  const biz = tmpRepo();
  try {
    const odooStack = { environments: [{ id: "odoo", version: "latest" }] };
    generate(odoo, ConfigSchema.parse({ project: { name: "t" }, profile: { userType: "technical", experience: "standard" }, stack: odooStack }));
    generate(plain, ConfigSchema.parse({ project: { name: "t" }, profile: { userType: "technical", experience: "standard" } }));
    generate(biz, ConfigSchema.parse({ project: { name: "t" }, profile: { userType: "business", experience: "standard" }, stack: odooStack }));
    // odoo stack + technical → the full pack (SKILL.md + a reference guide) is present.
    assert.ok(readFileSync(resolve(odoo, ".claude/skills/odoo-18.0/SKILL.md"), "utf8"));
    assert.ok(readFileSync(resolve(odoo, ".claude/skills/odoo-18.0/references/odoo-18-model-guide.md"), "utf8"));
    // the pack.yaml overlay is NOT shipped into the workspace.
    assert.equal(existsSync(resolve(odoo, ".claude/skills/odoo-18.0/pack.yaml")), false);
    // no odoo in the stack → not copied.
    assert.equal(existsSync(resolve(plain, ".claude/skills/odoo-18.0/SKILL.md")), false);
    // business profile → gated out (stack packs are technical).
    assert.equal(existsSync(resolve(biz, ".claude/skills/odoo-18.0/SKILL.md")), false);
    // the pack is routed in AGENTS.md for the odoo workspace, not for the others.
    const odooRouting = readFileSync(resolve(odoo, "AGENTS.md"), "utf8");
    assert.match(odooRouting.slice(odooRouting.indexOf("skill-routing")), /odoo-18\.0/);
    assert.doesNotMatch(readFileSync(resolve(plain, "AGENTS.md"), "utf8"), /odoo-18\.0/);
    assert.doesNotMatch(readFileSync(resolve(biz, "AGENTS.md"), "utf8"), /odoo-18\.0/);
    // idempotent: a second generate reports everything unchanged.
    const second = generate(odoo, ConfigSchema.parse({ project: { name: "t" }, profile: { userType: "technical", experience: "standard" }, stack: odooStack })).artifacts;
    assert.equal(second.filter((a) => a.status !== "unchanged" && a.path.includes("odoo-18.0")).length, 0);
  } finally {
    rmSync(odoo, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
    rmSync(biz, { recursive: true, force: true });
  }
});

test("commit-msg hook is generated and blocks co-author", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    const hook = readFileSync(resolve(cwd, ".githooks/commit-msg"), "utf8");
    assert.match(hook, /Co-Authored-By/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
