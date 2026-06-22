# Design — 0017a: Stack detail → references + AGENTS.md pointers

## One source

Extract the body the per-stack layers render today (`renderLanguage/Framework/Environment` in
[blockManifest.ts](../../../../../src/generate/blockManifest.ts)) into a single `stackBody(config, type, entry)`.
That body is the **one source**, consumed by:
1. the **reference file** `references/stack/<id>.md`,
2. the **Copilot projection** `.github/instructions/<id>.instructions.md` (when a glob exists),
3. nothing else — AGENTS.md only carries a **pointer** to (1).

## AGENTS.md pointer (R2)

The `lang-*`/`fw-*`/`env-*` expand entries keep their ids; their content becomes a heading + a resolving link:

```
## TypeScript (Layer 1 — language) · target vlatest
Rules → [references/stack/typescript.md](references/stack/typescript.md) — applies to `**/*.ts, **/*.tsx`.
```

The link resolves from the repo root (where AGENTS.md lives), so 0016a's dangling-reference check guards it.

## New module `src/generate/references.ts`

- `stackGlob(type, id): string | null` — a small registry. Languages by extension (`typescript →
  **/*.ts,**/*.tsx`, `python → **/*.py`, `go → **/*.go`, `javascript`, `java`, `rust`, `csharp`, `ruby`,
  `php`), a few frameworks (`react`, `vue`, `svelte`). Environments and unknowns → `null` (no path trigger).
- `generateStackReferences(cwd, config, stack): WriteResult[]` — for each active entry:
  - `writeFile(references/stack/<id>.md, stackBody(...))` — always.
  - if `copilot` target **and** `stackGlob` ≠ null: `writeFile(.github/instructions/<id>.instructions.md,
    applyTo-frontmatter + stackBody)` — Copilot auto-loads it by path.

## De-hardcode the existing TS instruction

[`index.ts:203-225`](../../../../../src/generate/index.ts) hand-writes `typescript.instructions.md` (a thin
pointer to AGENTS.md). 0017a **removes** that special case and lets `generateStackReferences` emit it
generically — and with the real body, so Copilot actually gets the rules by path instead of a redirect.

## Wiring

`generate` (workspace level) calls `generateStackReferences(cwd, config, unionStack(config).stack)` and adds
the results to the artifact set, after the AGENTS.md/Copilot files. References are generated files (not
manifest-tracked in 0017a; integrity coverage is a possible follow-up).

## Testing

- `test/stack-references.test.js`: references generated + idempotent; AGENTS.md block is a pointer (no full
  body) and resolves (no dangling ref via `checkDocCoherence`); Copilot `.instructions.md` present for TS with
  `applyTo`, absent for a glob-less env, absent without the `copilot` target.
- Regenerate the AGENTS.md byte fixtures (all stack-bearing cases shrink); bump `TEMPLATES_VERSION`.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Block-id migration | avoided — ids stay; only content changes |
| Pointer rot | 0016a dangling-ref check guards every pointer; tested |
| Copilot glob gaps | glob registry returns null → no instructions file, pointer still works |
| Fixture churn | regenerate deliberately; assert idempotency |
| Drift between projections | single `stackBody` source feeds all outputs |
