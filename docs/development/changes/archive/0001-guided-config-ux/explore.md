# Explore — Guided configuration UX (AI-first, simple/advanced, multi-repo)

## Problem

Configuring a workspace must be **intuitive, sectioned, and well explained**. Today it is a single fixed
wizard that asks everything up front. For a greenfield project where the user knows what they want, that
is fine; for an **existing** project it is hard to choose correctly (missing/unknown languages, frameworks,
environments) and risky when there is existing docs/structure that could conflict.

Desired direction (agreed):
- **AI-guided config is the preferred path.** New project: minimal `init`, then describe the project and
  the AI asks/proposes. Existing project: an **analysis skill** inspects the repo, detects stack + gaps,
  proposes skills (via `find-skills`), and can propose reorganizing folders to a target structure.
- **Simple vs Advanced modes.** Advanced = fully parametrized manual control, near-zero maintenance,
  self-feeding; for power users. AI-guided = default.
- **Multi-repo:** a workspace may govern more than one linked repo. Design for it now (phased build).
- **De-hardcode** anything fixed/rigid → keep-it-simple, max compatibility & scalability, leaning on the
  AI + the base instructions.

First slice (agreed): **AI-guided analysis of an existing project.**

## Current state (code survey)

- **Wizard** — `src/commands/init.ts`: a linear `@clack/prompts` sequence with **hardcoded** option lists
  (`KNOWN_LANGUAGES`, `KNOWN_FRAMEWORKS`, environments, profile, `company`). One mode only. `--yes` runs a
  non-interactive default; `--from` imports. No "simple vs advanced" split.
- **Detection** — `src/detect/stack.ts`: best-effort, **Node/TS-centric**, manifest-only (`package.json`,
  `tsconfig.json`, `go.mod`, `pyproject.toml`/`requirements.txt`, `.nvmrc`, Docker). Gaps: shallow Go/Python
  (no framework/version depth), no monorepo/workspaces detection, no multi-package, no conflict detection
  (existing docs/paths), limited environments.
- **Schema** — `src/config/schema.ts`: **single-repo** model (`project` + `stack` + layers). No `repos[]`.
  `company` is now `none|example` (extension point). Registry of bundled modules is hardcoded
  (`src/modules/registry.ts`).
- **Skills already present that help** — `find-skills` (discover/install from the open ecosystem),
  `ai-workspace-guide` (onboarding), `living-docs` (status). The SDD `sdd-*` family exists for change flow.
- **Generation** is idempotent and managed-block based (safe to re-run), so an AI-guided flow that writes
  `workspace.config.yaml` then runs `generate` is safe by construction.

## Options

### A. AI-guided existing-project analysis as a **skill** (recommended first slice)
A new skill (e.g. `configure-workspace`) that: (1) runs/extends `detectStack`, (2) reads existing docs/paths
to flag conflicts, (3) proposes a `workspace.config.yaml` + skills (using `find-skills`) + optional folder
reorg, (4) applies with explicit approval (Safety gate), then runs `generate`. Lives in `.claude/skills/`,
leans on the AI; the CLI stays thin. Pros: powerful, safe, low engine churn. Cons: relies on the agent
harness (Claude/Copilot) being present — acceptable since that is the product.

### B. Refactor the wizard into simple/advanced modes (CLI-first)
Split `init` into a short "simple" path and a fully-parametrized "advanced" path; de-hardcode option lists
into the registry so they self-feed. Pros: works without an agent. Cons: more engine work; the manual path
is the non-preferred one.

### C. Multi-repo model
Introduce a `repos[]` concept (a workspace governs N linked repos). Affects schema, detection (per repo),
generation (per repo + shared root), and distribution. Big; design the schema now, build in phases.

## Open questions
- Where does the AI-guided skill write/own state for multi-repo (root `workspace.config.yaml` with
  `repos[]` vs per-repo configs + a root link)?
- How much detection stays in TS (`detect/stack.ts`) vs delegated to the AI skill? Keep TS detection as a
  fast, deterministic seed; let the AI enrich/resolve ambiguity.
- Conflict/reorg proposals: propose-and-review only (never auto-move), consistent with the Safety gate.
- De-hardcoding: move `KNOWN_*` lists to `src/modules/registry.ts` as the single source so wizard + AI skill
  + docs all read one place.

## Direction taken (for the proposal)
SDD method. First slice = **Option A** (existing-project AI analysis skill), with **C**'s schema designed up
front (multi-repo-ready), and a **de-hardcode** pass (registry as single source) as the enabling refactor.
B (simple/advanced manual wizard) follows, reusing the registry.
