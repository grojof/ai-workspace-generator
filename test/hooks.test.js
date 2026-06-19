import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// 0010: the opt-in safety-guard hook (PreToolUse · Bash). Pure-Node, fails open, gated to claude+enabled.

function tmpRepo() {
  return mkdtempSync(join(tmpdir(), "aiws-hooks-"));
}
const settings = (cwd) => JSON.parse(readFileSync(resolve(cwd, ".claude/settings.json"), "utf8"));

test("hooks · off (default) emits no safety hook or script (E1)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" } }));
    assert.equal(existsSync(resolve(cwd, ".claude/hooks/safety-guard.mjs")), false);
    assert.equal(settings(cwd).hooks?.PreToolUse, undefined);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("hooks · warn/block generate the script + PreToolUse Bash wiring (E2)", () => {
  for (const mode of ["warn", "block"]) {
    const cwd = tmpRepo();
    try {
      generate(cwd, ConfigSchema.parse({ project: { name: "t" }, workflow: { hooks: { safetyGuard: mode } } }));
      assert.ok(readFileSync(resolve(cwd, ".claude/hooks/safety-guard.mjs"), "utf8"));
      const pre = settings(cwd).hooks.PreToolUse;
      assert.equal(pre[0].matcher, "Bash");
      assert.match(pre[0].hooks[0].command, new RegExp(`safety-guard\\.mjs ${mode}`));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test("hooks · the guard decides: deny/ask on risky, allow on safe (E3)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, workflow: { hooks: { safetyGuard: "block" } } }));
    const script = resolve(cwd, ".claude/hooks/safety-guard.mjs");
    const run = (cmd, mode) =>
      spawnSync("node", [script, mode], { input: JSON.stringify({ tool_input: { command: cmd } }), encoding: "utf8" });

    // risky → block emits deny.
    const deny = run("git push --force origin main", "block");
    assert.equal(deny.status, 0);
    assert.equal(JSON.parse(deny.stdout).hookSpecificOutput.permissionDecision, "deny");
    // risky → warn emits ask.
    assert.equal(JSON.parse(run("rm -rf build", "warn").stdout).hookSpecificOutput.permissionDecision, "ask");
    // a migration is flagged.
    assert.equal(JSON.parse(run("npx prisma migrate deploy", "block").stdout).hookSpecificOutput.permissionDecision, "deny");
    // safe → no decision (allow), exit 0.
    const safe = run("npm test", "block");
    assert.equal(safe.status, 0);
    assert.equal(safe.stdout.trim(), "");
    // malformed stdin → fails open (allow).
    const bad = spawnSync("node", [script, "block"], { input: "not-json", encoding: "utf8" });
    assert.equal(bad.status, 0);
    assert.equal(bad.stdout.trim(), "");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("hooks · copilot-only target gets no safety hook (E4)", () => {
  const cwd = tmpRepo();
  try {
    generate(cwd, ConfigSchema.parse({ project: { name: "t" }, targets: ["copilot"], workflow: { hooks: { safetyGuard: "warn" } } }));
    assert.equal(existsSync(resolve(cwd, ".claude/hooks/safety-guard.mjs")), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("hooks · coexists with the doc-sync Stop hook; idempotent (E5)", () => {
  const cwd = tmpRepo();
  try {
    const config = ConfigSchema.parse({ project: { name: "t" }, livingDocsHook: true, workflow: { hooks: { safetyGuard: "warn" } } });
    generate(cwd, config);
    const s = settings(cwd);
    assert.ok(s.hooks.Stop);
    assert.ok(s.hooks.PreToolUse);
    assert.ok(s.permissions);
    const second = generate(cwd, config);
    assert.equal(second.artifacts.filter((a) => a.status !== "unchanged").length, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
