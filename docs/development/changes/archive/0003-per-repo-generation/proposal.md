# Proposal — Per-repo generation

## Intent
Wire the existing multi-repo scaffolding (`repos[]`, `ResolvedRepo`, `resolveRepos` — shipped in 0001 but
never consumed) into the generation pipeline so **one workspace can govern more than one linked repo**. The
workspace **root** stays the canonical source of truth (`AGENTS.md` + SDD store + living docs + governance +
packaging); each linked repo gets its own AI **adapters** (CLAUDE.md, Copilot instructions, MCP) and the
**stack-specific skill packs** for *its* effective stack — **importing** the root `AGENTS.md` rather than
duplicating it.

This matches Claude Code's native model (verified against the official docs): project skills load from
`.claude/skills/` walking up to the repo root, and nested `.claude/skills/` under subdirectories load on
demand; CLAUDE.md loads hierarchically and supports relative `@../AGENTS.md` imports.

## Scope
- Split `generate()` into **workspace-level** artifacts (emitted once at the root) and **repo-level**
  artifacts (emitted once per `resolveRepos()` entry, against that repo's effective stack).
  - **Workspace-level (root):** `AGENTS.md`, SDD module, vendored workflow skills (sdd-*/secure-commit/…),
    living docs, docs index, governance, guides/learning/VS Code, scope, `.editorconfig`, `.gitattributes`,
    `AI-WORKSPACE.md`.
  - **Repo-level (per repo):** `CLAUDE.md` adapter, `.github/copilot-instructions.md`, `.mcp.json`,
    `.vscode/mcp.json`, **stack-bound** skill packs, the TypeScript path-scoped instruction.
- Parametrize the `CLAUDE.md` import target: `@AGENTS.md` for the root/single-repo, `@../AGENTS.md`
  (correct relative depth) for child repos.
- Split stack-pack generation: **non-stack** packs (sdd-*/corp-* — no `stackBinding`) stay workspace-level
  (root); **stack-bound** packs ship per repo, gated by each repo's effective stack.
- The root `AGENTS.md` `skill-routing` block lists the **union** of all resolved repos' stack packs (so it
  documents every stack skill present somewhere in the workspace) plus the workspace skills.
- Make `doctor` repo-aware: validate each resolved repo's adapters and the root `AGENTS.md` once.

## Out of scope
- Per-repo **distribution** (`ai-workspace package` per repo) → deferred to **0004**.
- Per-repo divergent profile / company / SDD / language (today `RepoSchema` overrides **`stack` only**).
- A folder-reorg helper and broader de-hardcode (separate changes).

## Risks
- **Idempotency regression.** The workspace/repo split must keep single-repo output byte-identical.
  *Mitigation:* empty `repos[]` ⇒ `resolveRepos` yields one repo at `.` ⇒ repo-level artifacts land at the
  root, identical to today; locked by golden fixtures + a second-`sync` 0/0 assertion.
- **Cross-repo import.** A child `CLAUDE.md` importing `../AGENTS.md` is an *external* import: Claude Code
  prompts for approval once, and it breaks if the child is cloned standalone (outside the workspace).
  *Mitigation:* document this as a **workspace** model (open the workspace root); Copilot's child file already
  mirrors the body, so it is self-contained.
- **Routing accuracy in multi-repo.** The root routing block must reflect the union of stacks, not an
  arbitrary single stack. *Mitigation:* compose routing over a union-stack config (identical to today when
  there is one repo).

## Acceptance
- A config with `repos: [{path: a, stack: …}, {path: b, stack: …}]` emits the root canonical set once and
  per-repo adapters under `a/` and `b/` with stack-correct skill packs and a working import to the root
  `AGENTS.md`.
- A config with empty `repos[]` produces **byte-identical** output to the current generator (goldens
  unchanged); a second `sync` reports **0 created / 0 updated**.
- `doctor` reports per-repo adapter presence. `npm run build` + full suite green.
