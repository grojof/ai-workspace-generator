# Tasks — Guided configuration UX (Phase 1 + multi-repo schema)

Status of the first implementation slice. Phases 2–4 (full de-hardcode beyond the wizard, simple/advanced
split, per-repo generation/distribution) are tracked for later changes.

## R1 — Registry as single source (de-hardcode the wizard)
- [x] Remove `KNOWN_LANGUAGES`/`KNOWN_FRAMEWORKS`/`KNOWN_ENVIRONMENTS` from `src/commands/init.ts`.
- [x] Build wizard options from `catalog("language"|"framework"|"environment")` (`src/modules/registry.ts`).
- [ ] (Later) Surface the same registry in `add`/`doctor` help text and docs consistently.

## R2–R5 — `configure-workspace` skill + `detect --json`
- [x] `ai-workspace detect [--json]` command (`src/commands/detect.ts`, wired in `cli.ts`) — deterministic seed.
- [x] Native skill `configure-workspace` (registry entry in `src/modules/skills.ts` + body in
      `src/generate/guides.ts`): Analyze → Propose → Review → Apply, **propose-and-review**.
- [x] `/configure` command + Copilot `configure.prompt.md`.
- [x] Skill references `detect --json`, `find-skills` for gaps, and "never write or move files without approval".
- [ ] (Later) Optional helper to apply an approved folder-alignment plan step-by-step (still manual today).

## R6 — Multi-repo schema (additive)
- [x] `RepoSchema` + optional `repos[]` on the config (`src/config/schema.ts`) — non-breaking.
- [x] `resolveRepos(config)` normalization (empty → `["."]`; per-repo stack override; root default).
- [ ] (Later) Per-repo `generate`/`package` iterate `resolveRepos()`.

## Tests
- [x] `config.test.js`: single-repo unchanged; `repos[]` validates; `resolveRepos` normalization.
- [x] `generate.test.js`: `configure-workspace` skill + `/configure` generated and routed.
- [x] Golden fixtures regenerated (skill-routing now includes `configure-workspace`).
- [x] Full suite green (57/57). Build clean.

## Verify (next)
- [ ] `verify-report.md`: confirm Phase 1 acceptance scenarios against the running CLI/skill.
- [ ] Archive: fold deltas into `docs/development/specs/` once verified.
