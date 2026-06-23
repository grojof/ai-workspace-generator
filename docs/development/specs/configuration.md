# Spec — Workspace configuration (current truth)

Stable specification of how a workspace is configured. Folded from changes
`0001-guided-config-ux` (Phase 1 + multi-repo schema), `0002-wizard-modes`,
`0003-per-repo-generation`, `0004-per-repo-distribution`, `0005-multi-repo-polish`, and `0006-codex-target`.
Update this file as the capability evolves.

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

## Targets and editors (change 0006)
- `targets` accepts `claude | copilot | codex` (one or more). `AGENTS.md` is always generated — it is the
  single source of truth **and** the native instructions file for **Codex**. `claude` adds `CLAUDE.md` +
  skills + `.mcp.json`; `copilot` adds `.github/*` (read by VS Code **and** Visual Studio); `codex` adds
  `.codex/config.toml` (project-scoped MCP in TOML). `targets: ["codex"]` ⇒ only `AGENTS.md` +
  `.codex/config.toml`.
- `vscode: boolean` (default `true`) gates the whole `.vscode/` folder (extensions/settings/mcp). Set
  `false` for Visual Studio or non-VS-Code users. The wizard asks it (Advanced); the `configure-workspace`
  skill sets it in the AI-guided path.
- **Copilot in Visual Studio** reads the generated `.github/copilot-instructions.md` /
  `instructions/*.instructions.md` after enabling *Tools → Options → GitHub → Copilot → Copilot Chat →
  custom instructions*. No extra generation needed.

## Multi-repo (schema + generation)
- The config accepts an optional, additive `repos[]` (`RepoSchema`: `path`, optional `name`, optional
  `stack`). Empty `repos[]` ⇒ single-repo (this directory). Existing single-repo configs are unaffected.
- `resolveRepos(config)` normalizes both cases to one shape: empty → `[{ path: ".", name, stack: root }]`;
  otherwise each repo's effective stack is its own `stack` or the root default.
- **Per-repo generation** (change 0003) wires `resolveRepos()` into `generate()`. Generation splits into:
  - **Workspace-level** (root, once, composed over `unionStack(config)` so it covers every repo's stack):
    `AGENTS.md`, the root `CLAUDE.md` bridge (`@AGENTS.md`), Copilot instructions, the engineering-practices
    baseline (`references/engineering-practices.md`, change 0018), `.mcp.json`/`.vscode/mcp.json`,
    `.claude/settings.json` + safety hook, SDD module, vendored workflow skills, **non-stack** skill packs
    (sdd-*/corp-*), living docs, docs index, governance, guides/learning/VS Code, scope/format files,
    `AI-WORKSPACE.md` (rendered last).
  - **Repo-level** (per `resolveRepos()` entry, over the repo's effective stack): a child `CLAUDE.md` that
    imports the root via `agentsImportPath(path)` (`a/` → `@../AGENTS.md`), and the **stack-bound** skill
    packs for that repo. Empty `repos[]` ⇒ the single `.` entry adds stack packs at the root, byte-identical
    to single-repo output.
- This matches each tool's discovery model: Claude reads `CLAUDE.md` (not `AGENTS.md`) hierarchically and
  `.claude/skills/` nested under the cwd → per-repo Claude adapter + skills; Copilot reads one workspace-root
  instructions file (no nested discovery) and MCP/settings are project-root scoped → those stay
  workspace-level. `doctor` validates each child's `CLAUDE.md` and the root once.
- **Per-repo distribution** (change 0004) makes `ai-workspace package` multi-repo aware: it aggregates
  skills, commands, and companion subagents from the workspace root **plus every resolved child repo** into
  the single umbrella plugin, and builds the per-skill org zips + `INSTALL.md` from that aggregated set.
  De-dup is **first-wins** by id (root before children, children in `resolveRepos` order). Topology is
  unchanged (one umbrella plugin, one marketplace entry); only the sources broaden. Empty `repos[]` ⇒ root
  only ⇒ unchanged.
- **Per-repo Copilot guidance** (change 0005): since Copilot has no nested discovery, each child repo gets a
  path-scoped instruction at the workspace root — `.github/instructions/<slug>.instructions.md` with
  `applyTo: "<path>/**"` summarizing that repo's stack. Single-repo emits none.
- **One-plugin-per-repo** (change 0005, opt-in): `distribution.perRepo: true` makes `package` emit one plugin
  per child repo (`plugins/<plugin>-<repoSlug>/`, sources = root + that child) in a multi-plugin marketplace,
  instead of the default umbrella. Org zips + `INSTALL.md` stay the full aggregate.
- **Out of scope (future):** per-repo divergent profile/company/SDD/language (today `RepoSchema` overrides
  `stack` only); id-collision warnings.

## Module registry as single source
- `src/modules/registry.ts` is the **single source** for selectable modules and their metadata, including
  per-module **VS Code recommendations** (`vscodeExtensions`) and per-language **formatters**
  (`vscodeFormatter`). `init`, `add`, `remove`, the `.vscode/*` generation and `doctor` all read from it —
  no hardcoded language maps (change 0005).
- `doctor` validates configured stack ids against the registry (parity with the MCP check) and warns on
  unknown ids; the `add`/`remove` help lists all four module types (`language|framework|environment|mcp`).

## Stack rendering & engineering baseline (change 0018)
- **Engineering-practices baseline.** Generation MUST emit one evergreen, **language-agnostic**
  `references/engineering-practices.md` ("rules with teeth": change discipline, data & migrations, secrets &
  supply chain, input & boundaries, error handling, testing, observability, performance), reached by a lean
  hub pointer block `aiws:engineering-practices` (after `harness-engineering`). It MUST NOT restate the Layer-0
  *Universal conventions* — the hub states the stance, the reference carries the depth.
- **Per-stack blocks are context7 pointers.** Each active stack entry keeps its managed block id
  (`lang-*`/`fw-*`/`env-*`, no migration) but its content is a single inline **context7 pointer** line
  (`stackPointer`). No per-stack prose body (`references/stack/<id>.md`) and no per-stack Copilot
  `.github/instructions/<id>.instructions.md` projection are generated. (The per-**repo** `applyTo` instruction
  of change 0005 is unrelated and unchanged.)
- **Stack/project specifics live in skill packs.** Stack- and project-specific rules are delivered via skill
  packs / skill groups (ours or a company's), the documented extension path — not per-stack templates.
- **Non-destructive migration.** `sync`/`generate` only write; they MUST NOT delete files they no longer author.
  Repos generated before 0018 keep their now-orphaned `references/stack/*.md` / per-stack `*.instructions.md` —
  documented as safe to remove (see `MAINTAINING.md`). The 12 `templates/{languages,frameworks,environments}/
  */layer.md.eta` and the `stackBody`/`generateStackReferences` path are removed.

## Acceptance (enforced)
- Wizard options derive from the registry (`config.test.js`, `registry.test.js`, build).
- `configure-workspace` skill + `/configure` are generated and routed (`generate.test.js`).
- Single-repo configs validate unchanged; `repos[]` validates; `resolveRepos` normalizes (`config.test.js`).
- Per-repo generation: root canonical + per-child adapter importing `@../AGENTS.md`, stack packs placed under
  the matching child only, union routing in the root `AGENTS.md`; multi-repo generation is idempotent
  (`multi-repo.test.js`).
- Per-repo distribution: `package` aggregates root + child skills/commands/agents into one umbrella plugin
  (deduped) with matching org zips + `INSTALL.md`; idempotent (`generate.test.js`).
- Per-repo Copilot `applyTo` instructions in multi-repo (none in single-repo) (`multi-repo.test.js`); VS Code
  recommendations/formatters come from the registry (`generate.test.js`); `doctor` warns on unknown stack ids
  (`generate.test.js`); `distribution.perRepo` emits per-repo plugins, default umbrella (`generate.test.js`).
- Codex target emits `.codex/config.toml` (TOML MCP) with `AGENTS.md` as its adapter; `targets: ["codex"]`
  yields no Claude/Copilot files; `vscode: false` omits `.vscode/*`, default unchanged (`generate.test.js`).
- Generation is idempotent and preserves out-of-band user text; single-repo `AGENTS.md` is byte-identical to
  the captured baseline (`invariants.test.js`, `block-manifest.test.js`).
- Stack rendering (0018): `references/engineering-practices.md` + the `aiws:engineering-practices` hub pointer
  are generated; each stack block is a single context7 pointer (no body file, no per-stack Copilot instruction);
  no `layer.md.eta` remains (`stack-references.test.js`, `registry.test.js`, `invariants.test.js`).
