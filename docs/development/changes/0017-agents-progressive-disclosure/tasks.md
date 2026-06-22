# Tasks — 0017 — AGENTS.md progressive disclosure

## 0017a — Stack detail → references + pointers
- [x] `stackBody(config, type, entry)` single source (in `references.ts`); `stackGlob` registry; `generateStackReferences`.
- [x] `blockManifest.ts`: `lang-*`/`fw-*`/`env-*` content → pointer (heading + resolving link), ids unchanged (no migration).
- [x] Emit `references/stack/<id>.md` (always) + `.github/instructions/<id>.instructions.md` (copilot target + glob).
- [x] De-hardcoded the `typescript.instructions.md` block in `index.ts` (now generic, with the real body).
- [x] Wired into `generate`; pointers resolve (doctor dangling-ref clean).
- [x] Tests: `stack-references.test.js` (124/124); regenerated AGENTS.md byte fixtures; `TEMPLATES_VERSION` → 0.51.0.
- [x] Dogfood synced; `doctor`/`verify` green; AGENTS.md 5903 → **5645** tokens; documented in `ARCHITECTURE.md`.

## 0017b — Task detail de-duplicated against skills
> Revised by [research.md](research.md): Agent Skills is now a **cross-tool open standard** (Claude/Codex/
> Copilot/Cursor/opencode all read `SKILL.md`), so the skills carry task detail for **every** target — no
> separate plain-markdown reference needed. Lower risk than the original proposal.
- [ ] `sdd` block → lifecycle diagram + short orchestrator + pointer to the `aiws-sdd-*` **skills** (cross-tool).
- [ ] `harness-engineering`, `living-docs` → 2-line stance + pointer to the skill.
- [ ] Deep detail (if any) → the **skill's own `references/`** dir (Agent Skills spec), not repo-root.
- [ ] **Prune, don't just move:** drop lines that merely restate what a linter/CI or the skill already enforces.
- [ ] Align generated skills to the Agent Skills spec (name = dir, lowercase-hyphen; description ≤ 1024, what+when).
- [ ] Tests + byte fixtures; `TEMPLATES_VERSION` bump.
- [ ] Reconsider `skill-routing` (skills self-advertise via `description` cross-tool now) — slim or keep (clarify).

## Verify & archive
- [ ] `/aiws-audit` + verify against the spec; living docs; then archive 0017.
