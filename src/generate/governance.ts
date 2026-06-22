import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";
import { skillFrontmatter as frontmatter } from "./naming.js";

/**
 * Governance artifacts: skills + commands that enforce the version/security/commit
 * policy declared in AGENTS.md, plus a commit-msg git hook for hard enforcement.
 */

// --- aiws-dependency-upgrade skill (AI-facing → English only) ---------------------

const DEP_UPGRADE = `## aiws-dependency-upgrade

Rigorously assess whether a version bump or migration is **feasible and worth it** — before touching
anything. Never upgrade or migrate on your own initiative: it is a deliberate change requiring user
approval (see "Safety gate" in AGENTS.md).

### When
The user asks to update a dependency/language/framework, migrate, or resolve a version conflict.

### Procedure (do not skip steps)
1. **Inventory:** current version and why it's pinned (existing project = conservative by default).
2. **Target:** real latest stable / LTS — check **context7**, not memory.
3. **Compatibility:** review peer-dependencies across the WHOLE stack; find cascading incompatibilities.
4. **Breaking changes:** list them and which parts of the code would need to be **replaced**.
5. **Security:** advisories/CVEs for current and target versions; unmaintained deps.
6. **Feasibility verdict:** *do now* / *partial (what yes, what no)* / *defer*, with effort and risk.
7. State the **long-term recommendation** explicitly and **wait for the user's decision**.
8. Write the report (e.g. in \`openspec/changes/<change>/\` or \`docs/ai/\`). If approved, do it in small, verifiable steps.

> If the migration can't be done safely, say so clearly and propose the conservative path.
`;

// --- aiws-secure-commit skill -----------------------------------------------------

// AI skill → English only (token efficiency).
function secureCommit(config: Config): string {
  const c = config.workflow.commits;
  return `## aiws-secure-commit

Create commits following the project policy. ${c.automate === "with-approval" ? "Prepare and **ask for approval** before committing." : "**Never** commit automatically; leave it to the user."}

### Rules
- ${c.conventional ? "Conventional Commits, imperative (`feat:`, `fix:`, …). One logical change per commit." : "Clear imperative message. One logical change per commit."}
- Authored by the **user's git identity**.${c.coAuthor ? "" : " Do **not** add `Co-Authored-By:` or AI attribution."}
- Never use \`--no-verify\` or bypass hooks.

### Flow
1. Stage only this task's changes (selective \`git add\`).
2. Write the message (subject ≤ 72, body with the why).
3. ${c.automate === "with-approval" ? "Show the diff and message, ask for confirmation, commit on approval." : "Hand over the proposed message; the user commits."}
`;
}

// --- commands ----------------------------------------------------------------

// AI command → English only (token efficiency).
function commitCommand(config: Config): string {
  return `---
description: Create a commit following the project policy (no co-author, with approval).
---

# /aiws-commit

Follow the \`aiws-secure-commit\` skill and the commit policy in AGENTS.md. Prepare a commit with the current
task's changes, show me the message and ${config.workflow.commits.automate === "with-approval" ? "wait for my approval before running it" : "let me commit"}.
Never add Co-Authored-By or use --no-verify.
`;
}

function upgradeDepsCommand(): string {
  return `---
description: Assess a version bump/migration with the aiws-dependency-upgrade skill (feasibility + security).
---

# /aiws-upgrade-deps

Follow the \`aiws-dependency-upgrade\` skill. Do not change anything yet: investigate feasibility, compatibility
and security (use context7), give me a verdict with the long-term recommendation, and wait for my decision.
`;
}

function commandPrompt(body: string): string {
  return `---\nmode: agent\n---\n\n${body}`;
}

// --- commit-msg git hook -----------------------------------------------------

function commitMsgHook(config: Config): string {
  const blockCoAuthor = !config.workflow.commits.coAuthor;
  const conventional = config.workflow.commits.conventional;
  return `#!/bin/sh
# Managed by ai-workspace. Activate once: git config core.hooksPath .githooks
msg_file="$1"
subject="$(head -n1 "$msg_file")"
${
  blockCoAuthor
    ? `if grep -qiE '^Co-Authored-By:' "$msg_file"; then
  echo "x Commit policy: Co-Authored-By / AI attribution trailers are not allowed." >&2
  exit 1
fi`
    : "# co-author check disabled"
}
${
  conventional
    ? `case "$subject" in
  feat:*|fix:*|refactor:*|docs:*|test:*|chore:*|build:*|ci:*|perf:*|style:*|revert:*|feat\\(*|fix\\(*|refactor\\(*|docs\\(*|test\\(*|chore\\(*|build\\(*|ci\\(*|perf\\(*|style\\(*|revert\\(*) ;;
  Merge*|Revert*) ;;
  *)
    echo "x Commit policy: use Conventional Commits (e.g. 'feat: ...'). Got: $subject" >&2
    exit 1 ;;
esac`
    : "# conventional check disabled"
}
exit 0
`;
}

export function generateGovernance(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const p = docsPaths(config);
  const depUpgradeBody = DEP_UPGRADE.replaceAll("openspec/changes", p.changes).replaceAll(
    "docs/ai/",
    `${p.status}/`,
  );

  if (config.targets.includes("claude")) {
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/aiws-dependency-upgrade/SKILL.md"),
        frontmatter(
          "aiws-dependency-upgrade",
          "Assess feasibility and security of version bumps/migrations before touching anything. Trigger: when asked to update dependencies, migrate, or resolve version conflicts.",
        ) + depUpgradeBody,
      ),
    );
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/aiws-secure-commit/SKILL.md"),
        frontmatter(
          "aiws-secure-commit",
          "Create commits per policy (no co-author, with approval, conventional). Trigger: when committing changes.",
        ) + secureCommit(config),
      ),
    );
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-commit.md"), commitCommand(config)));
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-upgrade-deps.md"), upgradeDepsCommand()));
  }

  if (config.targets.includes("copilot")) {
    results.push(
      writeFile(
        resolve(cwd, ".github/prompts/aiws-commit.prompt.md"),
        commandPrompt(commitCommand(config).split("---\n").pop() ?? ""),
      ),
    );
    results.push(
      writeFile(
        resolve(cwd, ".github/prompts/aiws-upgrade-deps.prompt.md"),
        commandPrompt(upgradeDepsCommand().split("---\n").pop() ?? ""),
      ),
    );
  }

  if (config.workflow.commits.gitHook) {
    results.push(writeFile(resolve(cwd, ".githooks/commit-msg"), commitMsgHook(config)));
  }

  return results;
}
