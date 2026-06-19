# Spec — Workspace configuration (current truth)

Stable specification of how a workspace is configured. Folded from change
`0001-guided-config-ux` (Phase 1 + multi-repo schema). Update this file as the capability evolves.

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

## Multi-repo (schema foundation)
- The config accepts an optional, additive `repos[]` (`RepoSchema`: `path`, optional `name`, optional
  `stack`). Empty `repos[]` ⇒ single-repo (this directory). Existing single-repo configs are unaffected.
- `resolveRepos(config)` normalizes both cases to one shape: empty → `[{ path: ".", name, stack: root }]`;
  otherwise each repo's effective stack is its own `stack` or the root default. Downstream per-repo logic
  iterates `resolveRepos()`. (Per-repo generation/distribution is a future phase.)

## Acceptance (enforced)
- Wizard options derive from the registry (`config.test.js`, `registry.test.js`, build).
- `configure-workspace` skill + `/configure` are generated and routed (`generate.test.js`).
- Single-repo configs validate unchanged; `repos[]` validates; `resolveRepos` normalizes (`config.test.js`).
- Generation is idempotent and preserves out-of-band user text (`invariants.test.js`).
