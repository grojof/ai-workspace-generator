# Spec — Workspace configuration (current truth)

Stable specification of how a workspace is configured. Folded from changes
`0001-guided-config-ux` (Phase 1 + multi-repo schema), `0002-wizard-modes`, and
`0003-per-repo-generation`. Update this file as the capability evolves.

## Sources of truth
- **Module registry** (`src/modules/registry.ts`) is the **single source** of selectable stack modules
  (languages, frameworks, environments, MCPs). The `init` wizard, the `configure-workspace` skill, and docs
  all read from it — no duplicated hardcoded lists.
- **`workspace.config.yaml`** is the single input; `AGENTS.md` is the generated source of truth; all other
  artifacts are idempotent projections.

## Detection
- `ai-workspace detect [--json]` performs best-effort, **non-destructive** stack detection (reads manifests
  only) and prints a human summary or raw JSON (`DetectedStack`). The JSON is the deterministic **seed** for
  the guided skill and other tooling.

## Guided configuration (AI-first, the default path)
- A native skill **`configure-workspace`** (+ `/configure` command, + Copilot prompt) guides setup for an
  **existing** repo (analyze → propose) or a **new** one (describe → ask):
  1. **Analyze** — seed with `detect --json`, then read the repo (manifests, layout, docs) to enrich.
  2. **Propose** — a candidate `workspace.config.yaml` + skill set (validating ids vs the registry; gaps via
     `find-skills`) + a **conflict report** (existing paths/docs that collide), with optional folder alignment.
  3. **Review** — present config (preview/diff) + rationale; nothing is written yet.
  4. **Apply** — only on approval: write the config and run `sync` (idempotent; user text outside managed
     markers survives). File moves are applied only as approved, step by step (Safety gate).
- **Invariant:** the skill never writes or moves files without explicit approval (propose-and-review).

## Modes
- AI-guided is the recommended default. A **manual wizard** (`ai-workspace init`) remains a complete
  fallback that works without an agent, with two paths (change 0002-wizard-modes):
  - **Simple** (default): asks only project name, docs language, and targets; **accepts the detected stack**;
    applies documented defaults (purpose=build, sdd on + files + sdd, living docs on, context7 on,
    company=none, safetyGuard new→warn/existing→off, all recommended skills).
  - **Advanced:** the fully-parametrized sequence (every layer; library-skill selection).
  - Resolution: `init --advanced` | `init --simple` (or `--yes`) | interactive prompt (Simple preselected).
  - Config assembly is a pure, shared `buildConfig(inputs, detected)` (`src/commands/wizard.ts`);
    `simpleDefaults(detected, basics)` fills the Simple inputs.

## Multi-repo (schema + generation)
- The config accepts an optional, additive `repos[]` (`RepoSchema`: `path`, optional `name`, optional
  `stack`). Empty `repos[]` ⇒ single-repo (this directory). Existing single-repo configs are unaffected.
- `resolveRepos(config)` normalizes both cases to one shape: empty → `[{ path: ".", name, stack: root }]`;
  otherwise each repo's effective stack is its own `stack` or the root default.
- **Per-repo generation** (change 0003) wires `resolveRepos()` into `generate()`. Generation splits into:
  - **Workspace-level** (root, once, composed over `unionStack(config)` so it covers every repo's stack):
    `AGENTS.md`, the root `CLAUDE.md` bridge (`@AGENTS.md`), Copilot instructions + the TS path-scoped
    instruction, `.mcp.json`/`.vscode/mcp.json`, `.claude/settings.json` + safety hook, SDD module, vendored
    workflow skills, **non-stack** skill packs (sdd-*/corp-*), living docs, docs index, governance,
    guides/learning/VS Code, scope/format files, `AI-WORKSPACE.md` (rendered last).
  - **Repo-level** (per `resolveRepos()` entry, over the repo's effective stack): a child `CLAUDE.md` that
    imports the root via `agentsImportPath(path)` (`a/` → `@../AGENTS.md`), and the **stack-bound** skill
    packs for that repo. Empty `repos[]` ⇒ the single `.` entry adds stack packs at the root, byte-identical
    to single-repo output.
- This matches each tool's discovery model: Claude reads `CLAUDE.md` (not `AGENTS.md`) hierarchically and
  `.claude/skills/` nested under the cwd → per-repo Claude adapter + skills; Copilot reads one workspace-root
  instructions file (no nested discovery) and MCP/settings are project-root scoped → those stay
  workspace-level. `doctor` validates each child's `CLAUDE.md` and the root once.
- **Out of scope (future):** per-repo *distribution* (`ai-workspace package` per repo); per-repo divergent
  profile/company/SDD/language (today `RepoSchema` overrides `stack` only); per-repo Copilot `applyTo`
  path-scoping.

## Acceptance (enforced)
- Wizard options derive from the registry (`config.test.js`, `registry.test.js`, build).
- `configure-workspace` skill + `/configure` are generated and routed (`generate.test.js`).
- Single-repo configs validate unchanged; `repos[]` validates; `resolveRepos` normalizes (`config.test.js`).
- Per-repo generation: root canonical + per-child adapter importing `@../AGENTS.md`, stack packs placed under
  the matching child only, union routing in the root `AGENTS.md`; multi-repo generation is idempotent
  (`multi-repo.test.js`).
- Generation is idempotent and preserves out-of-band user text; single-repo `AGENTS.md` is byte-identical to
  the captured baseline (`invariants.test.js`, `block-manifest.test.js`).
