# Tasks — 0016 — Documentation coherence & self-audit

## 0016a — Doc contract + coherence checks (ship first)

### Feature (one PR)
- [ ] `src/util/links.ts` — `extractLocalLinks(content)` (relative paths + wikilinks; skip URLs/anchors) + unit test.
- [ ] `src/config/schema.ts` — `docs.contract` (DocEntry[], owner enum) + `DEFAULT_DOC_CONTRACT`; defaulted so existing configs are unaffected.
- [ ] `src/generate/docsIndex.ts` — emit idempotent `docs/INDEX.md` from the resolved contract.
- [ ] `src/commands/doctor.ts` — dangling-reference check (warn) over tracked markdown.
- [ ] `src/commands/doctor.ts` — orphan-docs check (warn) with contract + root + `changes/` whitelist.
- [ ] `src/generate/livingDocs.ts` / `docsIndex.ts` — `aiws-doc-sync` text covers `docs/project/` from the contract.
- [ ] Tests: `doc-contract.test.js`, `doctor-coherence.test.js`, `util-links.test.js`.
- [ ] Regenerate byte fixtures deliberately; bump `TEMPLATES_VERSION`; `doctor`/`verify` green; idempotent.
- [ ] Update `docs/project/` (USAGE/EXTENDING/MAINTAINING) + `ARCHITECTURE.md` for the new contract/checks.

### Backlog cleanup (separate commit, repo-only)
- [ ] Archive changes 0012–0015 (fold baseline deltas into `specs/`, move folders to `changes/archive/`); check stale checkboxes (0013 reserved-ns guard landed in F2c).
- [ ] Refresh `docs/development/status/PROJECT-STATE.md` (v0.2.0 shipped, ADR 0003 complete, audit-remediation done).
- [ ] Fix block-id table in `docs/project/ARCHITECTURE.md` (`header`→`aiws:header`, …).

## 0016b — `aiws-audit` self-audit skill + command (read-only)
- [ ] Generated `aiws-audit` skill + `/aiws-audit` command → read-only, dated report under `docs/development/`.
- [ ] Registry row + skill routing; reuse `extractLocalLinks` + doctor/verify/reconcile signals.
- [ ] Tests + byte fixtures; `TEMPLATES_VERSION` bump.

## 0016c — AGENTS.md split
- [ ] **Deferred** (clarify Q2): revisit only when a new block actually breaches the token budget.

## Verify & archive
- [ ] `/aiws-sdd-verify` against the spec; living docs refreshed; then `/aiws-sdd-archive`.
