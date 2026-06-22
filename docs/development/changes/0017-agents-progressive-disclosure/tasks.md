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
- [ ] `sdd` block → lifecycle diagram + short orchestrator + pointer to `aiws-sdd-*` skills / `references/sdd.md`.
- [ ] `harness-engineering`, `living-docs` → 2-line stance + pointer; detail to `references/`.
- [ ] Tests + byte fixtures; `TEMPLATES_VERSION` bump.

## Verify & archive
- [ ] `/aiws-audit` + verify against the spec; living docs; then archive 0017.
