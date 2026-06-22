import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ConfigSchema } from "../dist/config/schema.js";
import { generate } from "../dist/generate/index.js";

// 0017 polish: generated skills MUST conform to the Agent Skills open standard (agentskills.io/specification)
// — now a cross-tool format read by Claude/Codex/Copilot/opencode. The frontmatter `name` must match the
// directory and be lowercase-hyphen (1-64 chars, no leading/trailing/consecutive hyphens); `description` must
// be non-empty and ≤ 1024 chars. This guards portability across every target.

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function generatedSkills(cwd) {
  const dir = resolve(cwd, ".claude/skills");
  return readdirSync(dir)
    .filter((n) => existsSync(resolve(dir, n, "SKILL.md")))
    .map((n) => ({ name: n, text: readFileSync(resolve(dir, n, "SKILL.md"), "utf8") }));
}

test("skill-spec · every generated skill conforms to the Agent Skills frontmatter standard", () => {
  const cwd = mkdtempSync(join(tmpdir(), "aiws-spec-"));
  try {
    // A rich config so the REASONS-mode + company skills are emitted too.
    generate(
      cwd,
      ConfigSchema.parse({
        project: { name: "t", mode: "new" },
        company: "example",
        sdd: { schema: "reasons" },
        stack: { languages: [{ id: "typescript", version: "latest" }] },
      }),
    );
    const skills = generatedSkills(cwd);
    assert.ok(skills.length >= 10, "a rich config emits many skills");

    for (const { name, text } of skills) {
      const fm = text.match(/^---\n([\s\S]*?)\n---/);
      assert.ok(fm, `${name}: has YAML frontmatter`);
      const nameField = fm[1].match(/^name:\s*(.+)$/m);
      const descField = fm[1].match(/^description:\s*(.+)$/m);

      assert.ok(nameField, `${name}: has a name field`);
      assert.equal(nameField[1].trim(), name, `${name}: name matches the directory`);
      assert.ok(NAME_RE.test(name) && name.length <= 64, `${name}: name is valid (lowercase-hyphen, ≤64)`);

      assert.ok(descField, `${name}: has a description field`);
      const desc = descField[1].trim();
      assert.ok(desc.length > 0 && desc.length <= 1024, `${name}: description is non-empty and ≤1024 chars`);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
