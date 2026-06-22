# Design — 0016a: Doc-structure contract + coherence checks

## Data model: the contract

Add to `src/config/schema.ts`:

```ts
const DocOwner = z.enum(["authored", "generated", "byte-for-byte"]);
const DocEntry = z.object({
  path: z.string(),           // workspace-relative, /-separated
  owner: DocOwner,
  description: z.string().optional(),
});
// docs.contract defaults to DEFAULT_DOC_CONTRACT (the docs the generator emits).
```

`DEFAULT_DOC_CONTRACT` lives next to the schema as data (like `BLOCK_MANIFEST`): the living docs
(`PROJECT-STATE.md`, `ARCHITECTURE.md` → `generated`), the project docs the generator seeds, and the index
itself. Users extend it in `workspace.config.yaml`; the default keeps existing configs working (R1).

## Generation: `docs/INDEX.md`

New small generator (`src/generate/docsIndex.ts` already exists for the human index — extend it, don't add a
parallel one) emits `docs/INDEX.md` from the resolved contract: a table `path · owner · description`. Written
via the normal idempotent `writeFile` so re-runs are `unchanged` (R2). It is itself a `generated` contract
entry.

## Doctor checks (pure functions over fs + contract)

Two new checks in `src/commands/doctor.ts`, both `warn`-level, added to the existing `findings` flow:

- **Dangling references** (R3): scan tracked markdown (the contract's docs + generated skills/commands) for
  `](relative/path)` and `[[wikilink]]`-style local links; resolve each against the workspace; a target that
  doesn't exist → `warn`. Skip `http(s):`, `mailto:`, anchors (`#…`), and absolute URLs. A shared
  `extractLocalLinks(content)` helper (new `src/util/links.ts`) keeps it testable and reusable by 0016b.
- **Orphans** (R4): walk files under `docs/`; an entry is an orphan if it is **not** in the contract **and**
  **not** the target of any local link from a tracked doc. Whitelist: repo-root docs and everything under
  `docs/development/changes/` (SDD artifacts are intentionally many and self-contained).

Both produce one summary finding each (count + first offenders), consistent with the current doctor output.
Conservative by design: false positives erode trust, so `warn` only and generous whitelisting.

## doc-sync coverage (R5)

`src/generate/livingDocs.ts` + `docsIndex.ts` instructions: the generated `aiws-doc-sync` command/skill text
gains a step to review the `docs/project/` docs declared in the contract (not a hard rewrite — a prompt to
keep them current). No new files beyond the index; this is wording derived from the contract.

## Backlog cleanup (R6, repo-only)

Mechanical, no code: archive `0012`–`0015` (fold any baseline-defining spec deltas into
`docs/development/specs/`, then move folders to `…/archive/`); rewrite `PROJECT-STATE.md`; fix the block-id
table in `docs/project/ARCHITECTURE.md`. Kept in a **separate commit** from the feature code.

## Testing

- `test/doc-contract.test.js` (new): default contract applies with no config; invalid owner rejected;
  `docs/INDEX.md` generated + idempotent.
- `test/doctor-coherence.test.js` (new): dangling ref flagged; orphan flagged; clean repo → `ok`; whitelist
  respected (root docs + changes/ not flagged).
- `test/util-links.test.js` (new): `extractLocalLinks` ignores URLs/anchors, catches relative paths + wikilinks.
- Regenerate byte fixtures only if generated output changes (the index + doc-sync wording will → deliberate
  bump of `TEMPLATES_VERSION`).

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Link scanner false positives | `warn` only; whitelist; unit-test the extractor against tricky inputs |
| Orphan check flags legit files | contract whitelist + root-doc whitelist + skip `changes/` |
| Fixture churn | regenerate deliberately; assert idempotency; bump version |
| Scope creep into 0016b | index/checks read-only; no report artifact here |
