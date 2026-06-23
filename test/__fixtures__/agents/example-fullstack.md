<!-- ai-workspace:begin:aiws:header -->
# t — AI Agent Guide (AGENTS.md)

This file is the **single source of truth** for AI agents (Claude Code, GitHub Copilot, Cursor…).
Tool-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`) are generated adapters that
mirror or import this content — **edit rules here**, then run `ai-workspace sync`.

Sections between `ai-workspace:begin/end` markers are generated. Add your own notes **outside** them;
they survive regeneration.
<!-- ai-workspace:end:aiws:header -->

<!-- ai-workspace:begin:aiws:core -->
## Universal conventions (Layer 0)

These apply to every contributor and every file, regardless of language.

### Encoding & line endings
- Files are **UTF-8**, no BOM. Newlines are **LF**. Final newline at EOF.
- `.editorconfig` and `.gitattributes` enforce this — do not fight them.

### Commits
- **Conventional Commits** in the **imperative mood**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Subject ≤ 72 chars, present tense ("add", not "added"). Explain the *why* in the body.
- One logical change per commit. Do not mix refactors with behavior changes.

### Code style
- Match the surrounding code: naming, structure, comment density, idioms.
- Names are descriptive and in **English**. No abbreviations that aren't standard.
- Keep functions small and single-purpose. Prefer early returns over deep nesting.
- No dead code, no commented-out blocks, no leftover debug logging.

### Reviews & safety
- Never commit secrets. Never weaken auth, validation, or escaping to "make it work".
- Validate inputs at boundaries. Handle errors explicitly — no silent catches.
- Changes that are hard to reverse or outward-facing need explicit confirmation.

### Token efficiency (how agents should work here)
- **Reference, don't duplicate.** Link to skills/docs instead of restating them.
- Load detail on demand: read scoped instructions/skills only when relevant.
- Prefer the living docs (`docs/development/status/PROJECT-STATE.md`) over re-scanning the whole repo.
- Use **context7** (MCP) for up-to-date, version-pinned library docs instead of guessing.
- **Offer, don't dump.** When extra explanation is optional, offer "say **X** and I'll explain X" instead of long unsolicited detail.

### Diagrams
- Use **Mermaid** for architecture, data flow, module dependencies and the SDD lifecycle.
- Keep diagrams in `docs/development/status/ARCHITECTURE.md`; regenerate with `/aiws-doc-sync`.
- **Always quote node labels** that contain special characters (`/`, `.`, `:`, `+`, `@`, `·`, `*`, `()`, `&`, `<br/>`): write `A["src/index.ts<br/>entry"]`, never `A[src/index.ts<br/>entry]`. Unquoted special characters cause flaky rendering across Mermaid versions (e.g. GitHub's intermittent `translate(undefined, NaN)` error).
<!-- ai-workspace:end:aiws:core -->

<!-- ai-workspace:begin:aiws:profile -->
## User profile (Layer 0 — governance posture)

Active profile: **technical** · **standard**. Apply this posture by
default. It tunes guidance and verbosity — it never overrides the Safety gate, idempotency, or commit policy.

**As a technical user:**
- Prioritize precision, maintainability, architecture, testing, security and performance.
- Use the full technical flow (SDD, living docs, context7) and keep Claude Code / VS Code / Copilot parity.
- Require explicit confirmation for destructive changes, migrations, security, data, commits, critical
  dependencies and architecture decisions.

**At standard level:**
- Balance guidance and flexibility. Offer alternatives when they add real value.
- Ask when a decision affects design or maintainability; allow reasonable manual configuration.
- Keep protections on destructive changes, security, commits and sensitive data.
<!-- ai-workspace:end:aiws:profile -->

<!-- ai-workspace:begin:aiws:versioning -->
## Versioning policy (Layer 0)

This project is treated as **NEW (greenfield)**.

**New project — current and stable.**
- Choose **current stable** versions (prefer LTS where it exists), not bleeding-edge pre-releases.
- Pick versions that are **mutually compatible** across the whole dependency set; verify peer-dependency
  ranges before pinning.
- Pin versions explicitly and record them in `workspace.config.yaml`.

For exact, up-to-date version facts and compatibility, query **context7** for each library — do not guess.
<!-- ai-workspace:end:aiws:versioning -->

<!-- ai-workspace:begin:aiws:safety -->
## Safety gate (Layer 0)

Hard rules so the AI stays reliable and never "goes rogue" on risky changes.

**STOP and ask** before any of these — never do them silently as part of another task:
- Upgrading or downgrading a language/framework/package version.
- Running or writing a **migration** (data, schema, framework major).
- Resolving a **conflict** (merge, dependency, breaking API) where more than one outcome is plausible.
- Anything **irreversible or outward-facing** (deleting data, publishing, force-push, changing CI/CD).
- Touching auth, secrets, crypto, permissions, or input validation.

**When you hit one of the above:**
1. **Verify feasibility first.** Do not assume a migration/upgrade is possible. Check breaking changes,
   peer-dependency compatibility across the whole stack, and security advisories (use **context7**).
2. **Present options**, each with effort, risk, and what would need to be replaced.
3. **Recommend the best long-term option** explicitly, with the reasoning.
4. **Wait for the user's explicit decision.** Do not proceed on assumption.

**Security is never traded away.** Do not weaken validation, auth, or escaping to make something work or
to resolve a conflict. Never commit secrets. Flag vulnerable or unmaintained dependencies.

> If a request would require breaking these rules, say so and propose a safe alternative instead of
> complying silently.
<!-- ai-workspace:end:aiws:safety -->

<!-- ai-workspace:begin:aiws:workflow -->
## Development workflow (Layer 0) — **mandatory**

A single, structured way of working. This flow is **not optional**: do not skip
steps even if asked to "just do it quickly". If a shortcut is requested, explain the risk and follow the flow.

**The flow for any change**
1. **Non-trivial change** → use SDD: `/aiws-sdd-explore` → `/aiws-sdd-propose` → `/aiws-sdd-clarify` → `/aiws-sdd-spec` + `/aiws-sdd-design` → `/aiws-sdd-tasks` → `/aiws-sdd-apply` → `/aiws-sdd-verify` → `/aiws-sdd-archive`.
2. **Small change** → implement directly, then run `/aiws-doc-sync`.
3. Honor the **Safety gate** above for anything risky.
4. **Commit** following the policy below.

**Commit policy**
- **Conventional Commits**, imperative mood (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). One logical change per commit.
- Commits are authored by the **user's own git identity**. Do **not** add `Co-Authored-By:` or any AI-attribution trailers.
- **Automate with approval:** after a completed change (spec-driven or small), prepare the commit and ask for confirmation; commit **only** once the user approves. Use the `/aiws-commit` command.
- Never use `--no-verify` or bypass hooks.

> Enforcement: a `commit-msg` git hook in `.githooks/` blocks disallowed commits. Activate once with
> `git config core.hooksPath .githooks`.
<!-- ai-workspace:end:aiws:workflow -->

<!-- ai-workspace:begin:aiws:harness-engineering -->
## Harness engineering (Layer 0)

This workspace **is the agent's harness** — the instructions, skills, tools and docs that shape the AI's
work. *Agent = model + harness*; tune the harness, not the model.

**Context is finite — spend it on the smallest set of high-signal tokens:**
- **Progressive disclosure.** Load skills/`references/` by trigger, on demand — not preemptively.
- **Just-in-time over preloaded.** Pull version-pinned facts via **context7**; don't guess or paste big docs.
- **Memory over recall.** Keep durable state in the living docs (`docs/development/status/*`), not the chat.
- **Clear, non-overlapping tools/skills.** If you can't tell which one applies, fix its description.

**The ratchet principle (how this file grows).** Every standing rule should trace to a **real, observed
failure**. When the agent slips, tighten the harness (a skill, a hook, a description) rather than appending
prose — keeping guidance at the **right altitude**: specific enough to steer, lean enough to stay read.

> Before adding to this file, ask: *what failure does this prevent?* If there isn't one, don't add it.
<!-- ai-workspace:end:aiws:harness-engineering -->

<!-- ai-workspace:begin:aiws:engineering-practices -->
## Engineering practices (Layer 0 — craft baseline)

Beyond the Layer-0 *stance* above, a language-agnostic **craft baseline** carries the depth — change
discipline, data & migrations, secrets & supply chain, input & boundaries, error handling, testing,
observability and performance, as concrete "rules with teeth". Load it on demand; don't inline it here.
Stack- and project-specific rules are **not** in the baseline by design — they live in **skill packs**.

Rules → [references/engineering-practices.md](references/engineering-practices.md).
<!-- ai-workspace:end:aiws:engineering-practices -->

<!-- ai-workspace:begin:aiws:routing -->
## Intent routing (Layer 0)

**The user should not need to remember commands.** From plain language, detect the intent and apply the
right flow yourself. Slash commands (`/...`) and prompts are **optional manual shortcuts** — prefer doing
the work over telling the user to run a command (mention the command only as an aside).

| The user says (in any wording)… | You do… |
|---------------------------------|---------|
| "let's start this project / set the ground rules", and `docs/development/constitution.md` is still the seed | First establish the **constitution** (project principles) — Spec-Kit-style bootstrap, once — then proceed. |
| "let's build / add / implement <feature>", anything non-trivial | Run the **SDD flow** (explore → propose → **clarify** → spec → design → tasks → apply → verify → archive). It's a methodology, not a tool — artifacts are Markdown in `docs/development/`. |
| A small, well-understood change | Implement directly, then refresh living docs. |
| "update / upgrade / bump / migrate / install a newer version" | **Do NOT just do it.** Run the `aiws-dependency-upgrade` assessment first (feasibility + security), then await the decision. |
| "commit / save / guarda los cambios", or you just finished a change | Use the **aiws-secure-commit** flow: prepare a conventional commit, no co-author, and ask for approval before committing. |
| "I'm new / how does this work / explain SDD / how do I start" | Use the **aiws-workspace-guide**. |
| "set up the editor / which extensions / profiles" | Use the **aiws-vscode-setup** guidance. |
| Anything risky, a conflict, or version/migration change | Honor the **Safety gate**: stop, verify feasibility, recommend, await decision. |
| You finished a task and project state changed | Refresh the living docs (`docs/development/status/*`). |

When intent is ambiguous, ask one short clarifying question, then proceed. Never silently skip the
Safety gate or the commit policy because the user phrased a request casually.
<!-- ai-workspace:end:aiws:routing -->

<!-- ai-workspace:begin:aiws:skill-routing -->
## Skill routing (Layer 0)

Load skills by their *trigger*, not preemptively. Selection for the **technical** · **standard** profile:

| Skill | When | Load |
|-------|------|------|
| `aiws-secure-commit` | committing changes | always |
| `aiws-sdd-*` | planning/implementing a non-trivial change | suggested |
| `aiws-living-docs` | after finishing a task or when project state changed | suggested |
| `aiws-workspace-guide` | new here — how this workspace works | suggested |
| `aiws-configure-workspace` | configuring or re-configuring the workspace (analyze an existing repo, or set up a new one) | suggested |
| `aiws-dependency-upgrade` | before any version bump or migration (assess first) | on-demand · high risk |
| `aiws-reconcile` | after a base upgrade / `packs sync`, to audit company overlays vs the base | on-demand |
| `aiws-audit` | periodically or after big changes — audit workspace health & coherence (read-only) | on-demand |
| `aiws-vscode-setup` | setting up VS Code / extensions | on-demand |
| `find-skills` | discovering/installing skills from the open ecosystem (npx skills) | on-demand |
| `frontend-design` | designing or polishing a web frontend (layout, typography, color, spacing, visual taste) | on-demand |
| `frontend-ui-dark-ts` | working with the frontend-ui-dark-ts stack | on-demand |
| `mcp-builder` | building or evaluating an MCP server (tools, resources, Node or Python, best practices) | on-demand |
| `skill-creator` | authoring, structuring or evaluating a Claude skill (SKILL.md, references, packaging) | on-demand |
| `webapp-testing` | testing a running web app end-to-end (browser automation, console logs, Playwright-style flows) | on-demand |

> `always` skills are the baseline; `suggested` ones activate by context; `on-demand` only when asked.
> Don't activate skills that don't apply to this profile.
<!-- ai-workspace:end:aiws:skill-routing -->

<!-- ai-workspace:begin:aiws:lang-typescript -->
## typescript (Layer 1 — language) · target vlatest
> Query **context7** for `typescript@latest` best practices.
<!-- ai-workspace:end:aiws:lang-typescript -->

<!-- ai-workspace:begin:aiws:lang-go -->
## go (Layer 1 — language) · target vlatest
> Query **context7** for `go@latest` best practices.
<!-- ai-workspace:end:aiws:lang-go -->

<!-- ai-workspace:begin:aiws:fw-react -->
## react (Layer 2 — framework) · target vlatest
> Query **context7** for `react@latest` best practices.
<!-- ai-workspace:end:aiws:fw-react -->

<!-- ai-workspace:begin:aiws:env-wsl -->
## wsl (Layer 3 — environment) · latest
> Query **context7** for `wsl` setup and best practices.
<!-- ai-workspace:end:aiws:env-wsl -->

<!-- ai-workspace:begin:aiws:env-docker -->
## docker (Layer 3 — environment) · latest
> Query **context7** for `docker` setup and best practices.
<!-- ai-workspace:end:aiws:env-docker -->

<!-- ai-workspace:begin:aiws:company-overlay -->
## Company overlay — Example Co (Layer 4)

> **Placeholder.** This is the optional *organization overlay* extension point. Copy this folder to
> `templates/company/<your-org>/`, add `<your-org>` to the `company` enum in `src/config/schema.ts`,
> and replace the text below with your real culture + working rules. With `company: none` (the default)
> none of this is emitted. See `docs/project/EXTENDING.md`.

You operate on behalf of **Example Co**. Culture sets direction; the rules are guard-rails that always apply.

**Pillars:** *Quality* (do it right from the start; validate before delivering) · *Customer Centric*
(honor commitments; communicate early) · *Operational Excellence* (rigor, efficiency, data-driven).

**Working rules (always on):**
1. **Zero fabrication** — no fictional info; separate facts / interpretation / hypotheses.
2. **Rigor** — every technical claim carries argument + source + limitations.
3. **Critical thinking** — challenge wrong premises; correctness over comfort.
4. **Data protection** — flag privacy/regulatory concerns before handling sensitive data.
5. **Format** — clear structure; answer in the user's language, English for technical terms.
6. **Escalation** — risks and critical changes are decided by authorized humans; the agent informs.

In tension, the rule wins because the pillar wins.
<!-- ai-workspace:end:aiws:company-overlay -->

<!-- ai-workspace:begin:aiws:company -->
## Company conventions (Layer 4 — organization overlay)

Reusable across projects of this organization. Fill in via `workspace.config.yaml` (`conventions:`).

- **File naming:** kebab-case
- **Naming prefixes / dynamic tokens:** _(none defined — add under `conventions.prefixes`)_

> This layer holds organization-specific rules (prefixes, internal libraries, forbidden patterns).
> Updating the base layers never overwrites it.
<!-- ai-workspace:end:aiws:company -->

<!-- ai-workspace:begin:aiws:business -->
## Business / domain logic (Layer 5 — project)

Project-specific domain knowledge. Keep this accurate — it is the AI's map of *what* you build.

**Ubiquitous language (glossary):** _(add terms under `business.glossary`)_

**Business invariants:** _(add rules under `business.invariants`)_

> Keep this section and `docs/development/status/PROJECT-STATE.md` in sync via `/aiws-doc-sync`.
<!-- ai-workspace:end:aiws:business -->

<!-- ai-workspace:begin:aiws:sdd -->
## Spec-Driven Development (SDD)

A lightweight **methodology — not a tool dependency**. We adopt the best *ideas* from two SDD projects
and keep every artifact as plain Markdown; **no external CLI is required or installed**:

- **Spec-Kit** → the greenfield *bootstrap*: a project **constitution** (principles) and a **clarify** step.
- **OpenSpec** → the steady state: changes as **deltas** against a living spec baseline, then archived.

Backend: **files**.

**Lifecycle**

```mermaid
flowchart LR
  C[constitution] -.once.-> E
  E[explore] --> P[propose] --> CL[clarify] --> S[spec]
  P --> D[design]
  S --> T[tasks]
  D --> T
  T --> A[apply] --> V[verify] --> R[archive]
```

**Which idea applies, by project mode**
- **This is a new project** (`mode: new`): write the **constitution** once (Spec-Kit idea), then evolve
  through delta changes (OpenSpec idea).
- Project *mode* governs the one-time ramp; per-feature, the size/risk of the change decides whether the
  full flow is worth it.

**Commands** (Claude: `/aiws-sdd-*`; Copilot: prompt files in `.github/prompts/`)
- `/aiws-sdd-constitution` — define the project's principles (once).
- `/aiws-sdd-explore <topic>` — investigate before committing.
- `/aiws-sdd-propose` → `/aiws-sdd-clarify` → `/aiws-sdd-spec` + `/aiws-sdd-design` → `/aiws-sdd-tasks` → `/aiws-sdd-apply` → `/aiws-sdd-verify` → `/aiws-sdd-archive`. Each phase's **`aiws-sdd-*` skill** carries its inputs, output template and quality bar — loaded on demand (cross-tool Agent Skills).

**Artifacts** live in `docs/development/changes/<change-name>/` and are **versioned in git** (reviewable in PRs, readable by any AI tool). The store follows OpenSpec's *layout* (specs + changes + archive) as a convention — it is **not** the OpenSpec CLI.

**Rules**
- For non-trivial features, create a proposal/spec before implementing.
- `clarify` resolves ambiguity *before* the spec is finalized. Specs are the source of truth for *what*;
  design for *how*; tasks track progress.
- New specs and designs must honor `docs/development/constitution.md`.
- After implementing, run `/aiws-sdd-verify` against the spec, then `/aiws-sdd-archive` (folds the delta into `docs/development/specs/`).
<!-- ai-workspace:end:aiws:sdd -->

<!-- ai-workspace:begin:aiws:living-docs -->
## Living documentation

The project keeps an always-current, token-cheap snapshot of its own state so agents get context
without re-scanning everything.

- `docs/development/status/PROJECT-STATE.md` — overview, module map, **stack & production-target decision (what + why)**, lightweight decisions log, current status.
- `docs/development/status/ARCHITECTURE.md` — architecture with **Mermaid** diagrams.

**Keep it fresh:** run `/aiws-doc-sync` (Claude) or the `doc-sync` prompt (Copilot) when you finish a task.
It derives change status from `docs/development/changes/*`. Read these files first; they are cheaper than scanning the repo.
<!-- ai-workspace:end:aiws:living-docs -->
