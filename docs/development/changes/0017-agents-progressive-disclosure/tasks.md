# Tasks — 0017 — AGENTS.md progressive disclosure

## 0017a — Stack detail → references + pointers
- [ ] Extract `stackBody(config, type, entry)` from `renderLanguage/Framework/Environment` (one source).
- [ ] `src/generate/references.ts`: `stackGlob(type, id)` registry + `generateStackReferences(cwd, config, stack)`.
- [ ] `blockManifest.ts`: `lang-*`/`fw-*`/`env-*` expand content → pointer (heading + resolving link), ids unchanged.
- [ ] Emit `references/stack/<id>.md` (always) + `.github/instructions/<id>.instructions.md` (copilot target + glob).
- [ ] De-hardcode the existing `typescript.instructions.md` block in `index.ts` (subsumed by the generic emitter).
- [ ] Wire `generateStackReferences` into `generate`; pointers resolve (doctor dangling-ref clean).
- [ ] Tests: `stack-references.test.js`; regenerate AGENTS.md byte fixtures; bump `TEMPLATES_VERSION`.
- [ ] Dogfood `sync`; `doctor`/`verify` green; document in `ARCHITECTURE.md`.

## 0017b — Task detail de-duplicated against skills
- [ ] `sdd` block → lifecycle diagram + short orchestrator + pointer to `aiws-sdd-*` skills / `references/sdd.md`.
- [ ] `harness-engineering`, `living-docs` → 2-line stance + pointer; detail to `references/`.
- [ ] Tests + byte fixtures; `TEMPLATES_VERSION` bump.

## Verify & archive
- [ ] `/aiws-audit` + verify against the spec; living docs; then archive 0017.
