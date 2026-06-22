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
- [x] `sdd` block: **pruned** the verbose REASONS detail (schema/builder/lifecycle/audits — all backed by the cross-tool `aiws-sdd-*` skills) to one concise pointer; added a one-clause cross-tool skill note to the flow line.
- [x] Honest measurement (`estimateTokens`): **REASONS mode −~170 tok** (where the duplication lived); **sdd mode +~20** (the cross-tool pointer) — sdd-mode wasn't bloated, so it isn't padded; this repo 5645 → 5678.
- [x] **`harness-engineering` stays inline** — it's Layer-0 *stance* (how the harness evolves), has no skill home, and is already lean. **`living-docs` stays** — already a pointer to `/aiws-doc-sync` (its skill); ~lean.
- [x] Tests green (124/124); byte fixtures regenerated; `TEMPLATES_VERSION` → 0.52.0; dogfood synced; doctor 0/0.
- [ ] Deferred polish: align skill frontmatter to the Agent Skills spec (validate via `skills-ref`); reconsider `skill-routing` — small follow-ups, not blocking.

## Verify & archive
- [ ] `/aiws-audit` + verify against the spec; living docs; then archive 0017.
