# Proposal — Guided configuration UX

## Intent

Make configuring a workspace **intuitive and safe** by making **AI-guided configuration the default path**,
while keeping a fully-parametrized manual mode for power users. Configuration should work as well for an
**existing** repo (analyze → propose → apply) as for a **new** one (describe → ask → write). Design the
config model to be **multi-repo-ready** from the start, and **de-hardcode** fixed option lists so the system
self-feeds and stays low-maintenance.

## Scope (phased)

**Phase 1 — Existing-project AI analysis (first slice).**
- New skill `configure-workspace` (`.claude/skills/`): scans the repo (seeded by `detect/stack.ts`), reads
  existing docs/paths to flag conflicts, and **proposes** a `workspace.config.yaml` + a skill set (using
  `find-skills` for gaps) + an optional folder-structure alignment. Applies only with explicit approval,
  then runs `generate`. Propose-and-review; never auto-moves files (Safety gate).
- Thin CLI touchpoint: `ai-workspace init` learns a `--guided` hint that scaffolds a minimal config and
  points the user to the skill (the heavy lifting is the AI skill, not CLI code).

**Phase 2 — De-hardcode (enabling refactor).**
- Move `KNOWN_LANGUAGES`/`KNOWN_FRAMEWORKS`/environments from `init.ts` into `src/modules/registry.ts` as
  the single source; wizard, the AI skill, and docs all read it. No behavior change; pure consolidation.

**Phase 3 — Simple/Advanced wizard.**
- `init` offers a short **simple** path (few questions, sensible defaults) and an **advanced** path
  (fully parametrized), both reading the registry. AI-guided remains the recommended default.

**Phase 4 — Multi-repo (schema now, build phased).**
- Extend the schema with an optional `repos[]` (a workspace governs N linked repos with a shared root +
  per-repo stack), keeping single-repo as the default shape. Detection, generation, and distribution become
  per-repo aware in later steps. Design the schema in this change; implement incrementally.

## Approach

- **Lean on the agent.** Deterministic TS detection stays as a fast seed; ambiguity resolution, gap
  proposals, and structure alignment are the AI skill's job. Keep the CLI thin.
- **Safe by construction.** Generation is idempotent + managed-block based; the skill writes config then
  generates. Folder reorg is proposed as a diff and applied only on approval.
- **Single source of truth.** Registry-driven options remove hardcoded drift.
- **Keep it simple.** Prefer additive, optional schema (`repos[]` optional) so nothing existing breaks.

## Out of scope (this change)
- Full multi-repo generation/distribution implementation (only the schema + design land here).
- Re-enabling CI/Dependabot (tracked separately).

## Risks
- **Agent-dependency:** the preferred path needs a harness (Claude/Copilot). Mitigation: the manual
  simple/advanced wizard remains a complete fallback.
- **Schema churn for multi-repo:** mitigate by making `repos[]` optional/additive and normalizing
  single-repo into the same internal shape.
- **Reorg safety:** never auto-move; propose-and-review only, behind the Safety gate.
- **Detection breadth:** keep TS detection best-effort; the AI skill covers the long tail.

## Acceptance (high level — full detail in spec)
- A user can point the tool at an existing repo and get a proposed, explained config + skill set, applied
  only on approval, producing a working workspace.
- Option lists come from one registry (no duplicated hardcoded lists).
- The schema accepts a multi-repo `repos[]` shape without breaking single-repo configs.

## Next SDD steps
`spec.md` (requirements + scenarios for Phase 1 + the multi-repo schema) → `design.md` (skill contract,
registry refactor, `repos[]` schema + Mermaid) → `tasks.md` → `apply`.
