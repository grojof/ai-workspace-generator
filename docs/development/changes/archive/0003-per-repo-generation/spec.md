# Spec — Per-repo generation

> Delta against `docs/development/specs/configuration.md` (the multi-repo `repos[]`/`resolveRepos` baseline
> from 0001). This change makes the pipeline **consume** that scaffolding.

## R1 — Workspace vs repo artifact split
`generate` MUST partition artifacts into **workspace-level** (emitted once at the workspace root) and
**repo-level** (emitted per resolved repo). The split follows each tool's real discovery model (verified vs
the Claude Code docs): Claude discovers `CLAUDE.md` hierarchically and `.claude/skills/` nested under the
cwd, so the **Claude** adapter + stack skills are per-repo; **Copilot** reads a single workspace-root
`.github/copilot-instructions.md` (no nested discovery) and **MCP/settings** are project-root scoped, so
those stay workspace-level (composed over the **union** stack).

- **Given** any config, **then** workspace-level artifacts are written once at the root: `AGENTS.md`
  (union stack), the root `CLAUDE.md` bridge (`@AGENTS.md`), Copilot instructions (union stack) + the TS
  path-scoped instruction, `.mcp.json`, `.vscode/mcp.json`, `.claude/settings.json` + safety hook, the SDD
  module, vendored workflow skills, **non-stack** packs, living docs, docs index, governance,
  guides/learning/VS Code, scope, `.editorconfig`, `.gitattributes`, `AI-WORKSPACE.md`.
- **Given** any config, **then** repo-level artifacts are written per `resolveRepos()` entry under its
  `path`: a child `CLAUDE.md` (import-parametrized) and the **stack-bound** skill packs for that repo's
  effective stack.

> **Root needs a `CLAUDE.md`.** Claude Code reads `CLAUDE.md`, not `AGENTS.md`; the root therefore gets a
> `CLAUDE.md` that imports `@AGENTS.md` (a bridge, **not** a stack/code adapter — the root carries no stack
> skills). This refines the "root = coordinator" decision with a tool-mechanics fact.

## R2 — Effective stack per repo
Repo-level generation MUST use each repo's **effective stack** (`ResolvedRepo.stack` = the repo's own
`stack` or the root default).

- **Given** repo-a bound to `{python}` and repo-b bound to `{typescript}`, **when** generating, **then**
  repo-a receives the Python stack packs and repo-b the TypeScript stack packs **and** the TS path-scoped
  instruction.
- **Given** a repo without an explicit `stack`, **then** it inherits the root `stack`.

## R3 — Canonical source stays at root
Linked repos MUST **reference**, not duplicate, the root `AGENTS.md`.

- **Given** a child repo at `a/`, **then** its `CLAUDE.md` imports the root via the correct relative path
  (`@../AGENTS.md`).
- **Given** a child repo, **then** no second canonical `AGENTS.md` is written in it.
- **Given** populated `repos[]`, **then** the root receives **no stack skill packs** (it is the coordinator)
  but does receive the `CLAUDE.md` bridge so Claude Code can load `AGENTS.md` when the root is opened.

## R4 — Workspace vs stack-bound skill packs
Skill packs MUST be partitioned by whether they declare a `stackBinding`.

- **Given** a pack with **no** `stackBinding` (sdd-*/corp-*), **then** it is generated **once at the root**.
- **Given** a pack **with** a `stackBinding`, **then** it is generated **per repo**, gated by that repo's
  effective stack.
- **Given** the root `AGENTS.md` `skill-routing` block, **then** it lists the **union** of all resolved
  repos' applicable stack packs plus the workspace skills.

## R5 — Backward compatibility (single-repo)
Empty `repos[]` MUST produce output identical to the pre-change generator.

- **Given** empty `repos[]`, **then** `resolveRepos` yields one repo at `.`, all repo-level artifacts land at
  the root, and `CLAUDE.md` imports `@AGENTS.md` — **byte-identical** to today (golden fixtures unchanged).
- **Given** any config, **then** a second `sync` reports **0 created / 0 updated** (idempotency).

## R6 — Doctor multi-repo aware
`doctor` MUST validate each resolved repo's adapters and the root `AGENTS.md` once.

- **Given** populated `repos[]`, **then** doctor checks `CLAUDE.md`/Copilot presence under each repo `path`
  and `AGENTS.md` (token budget + orphaned blocks) at the root.
- **Given** empty `repos[]`, **then** doctor behaves as today.

## Acceptance
Multi-repo config emits a root-canonical set plus per-repo adapters with correct effective stacks and a
working import to the root `AGENTS.md`; single-repo output is unchanged (goldens green, second sync 0/0);
doctor is repo-aware; `npm run build` + full suite green.
