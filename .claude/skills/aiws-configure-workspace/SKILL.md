---
name: aiws-configure-workspace
description: >
  Configure or re-configure this AI workspace: analyze an existing repo (or set up a new one) and propose a workspace.config.yaml + skill set. Trigger: when the user wants to set up, configure, or re-detect the workspace.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.50.0
  version: "1.0"
---
## Configure this AI workspace (guided)

Help the user produce a correct, explained `workspace.config.yaml` and skill set — for an **existing** repo
(analyze → propose) or a **new** one (describe → ask). **Propose-and-review: never write or move files
without explicit approval.**

### 1. Analyze
- Run `ai-workspace detect --json` for a deterministic stack seed (languages/frameworks/environments).
- Read the repo to enrich it: manifests, folder layout, existing docs/configs. Note anything the detector
  missed. If nothing is detected and it's a new project, **ask** targeted questions instead of guessing.

### 2. Propose
- Draft a candidate `workspace.config.yaml` (project, profile, stack, sdd, language, targets…). Validate
  every module id against the registry (`ai-workspace list`); for a gap, propose either adding a module or
  discovering a pack with the `find-skills` skill — and say why.
- **Profile is the user's choice — never infer it.** `profile.userType` (technical | business) and
  `profile.experience` (beginner | standard | advanced) set the governance posture. Detection seeds the
  **stack only**; it does NOT tell you the user type. **Ask** both explicitly; do not assume "technical"
  because code was detected.

#### Option guide (what each means, and the *why* — explain before you ask)
- **targets** — which AI tools to wire: `claude` (CLAUDE.md + skills + .mcp.json), `copilot` (.github/*, also
  Visual Studio), `codex` (AGENTS.md as instructions + .codex/config.toml). *Why:* only generate for tools
  the user actually uses.
- **profile.userType** — `technical` (code/devops/data/infra) vs `business` (process/docs/analysis). *Why:*
  tunes how much architecture/testing/security depth the AI applies.
- **profile.experience** — `beginner` (clear guidance, safe paths) · `standard` (balance) · `advanced`
  (trade-offs, more autonomy). *Why:* tunes verbosity and how many decisions are surfaced.
- **project.mode** — `new` (use current stable versions) vs `existing` (conserve versions; upgrade only on
  assessment). *Why:* governs the versioning posture and the Safety gate.
- **project.purpose** — `build` (normal) vs `learn` (tutor mode). *Why:* adds learner skills/explanations.
- **stack** — languages / frameworks / environments (+ versions). *Why:* drives per-layer rules and VS Code recs.
- **sdd.enabled / backend / methodology** — SDD on/off; artifacts in `files` (recommended), `hybrid` (+ memory),
  or `none`; `sdd` vs `spdd`. *Why:* where specs live and how much process for non-trivial changes.
- **workflow.hooks.safetyGuard** — `warn` | `block` | `off` for risky-command hook (Claude). *Why:* hardens the
  Safety gate without changing the AGENTS.md rule.
- **vscode** — generate `.vscode/` recs; set `false` for Visual Studio / non-VS-Code. **mcp (context7)** — up-to-date
  library docs. **company** — org overlay (`none` for personal). **language** — human-facing docs language (AI files stay English).
- Produce a **conflict report**: existing paths/docs that would collide with generated structure, plus an
  optional folder-alignment plan. Multi-repo: if the workspace spans several repos, propose a top-level
  `repos:` list (each with its `path` and optional `stack`); a single repo needs no `repos`.

### 3. Review
- Show the proposed config (as a preview/diff) with a one-line rationale per section, the skill set, and the
  conflict report. Wait for approval or edits. Change nothing yet.

### 4. Apply (only after approval)
- Write `workspace.config.yaml`, then run `ai-workspace sync` to generate artifacts (idempotent — a second
  run reports 0 changes; your text outside managed markers survives). Apply any folder moves **only** as
  approved, one reviewable step at a time (Safety gate). Finish with `/aiws-doc-sync` if living docs are on.
