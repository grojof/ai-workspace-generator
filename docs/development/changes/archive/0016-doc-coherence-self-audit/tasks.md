# Tasks — 0016 — Documentation coherence & self-audit

## 0016a — Doc contract + coherence checks (ship first)

### Feature (one PR)
- [x] `src/util/links.ts` — `extractLocalLinks(content)` (relative paths; skip URLs/anchors) + unit test.
- [x] `src/config/schema.ts` — `docs.contract` (DocEntry[], owner enum) + `resolveDocContract` default; defaulted so existing configs are unaffected.
- [x] ~~emit `docs/INDEX.md`~~ **dropped** (maintainer feedback): contract lives in config; root `README.md` is the declared index (no competing index file).
- [x] `src/commands/doctor.ts` — dangling-reference check (warn) over the maintained docs.
- [x] `src/commands/doctor.ts` — orphan-docs check (warn) with contract + root-basename whitelist; SDD store out of scope.
- [x] `src/generate/livingDocs.ts` — `aiws-doc-sync` text covers `docs/project/` from the `docs.contract`.
- [x] Tests: `doc-contract.test.js`, `doctor-coherence.test.js`, `util-links.test.js` (117/117 green).
- [x] Bump `TEMPLATES_VERSION` (0.49.0); dogfood synced; `doctor`/`verify` green; idempotent.
- [x] Document the contract + coherence checks in `docs/project/MAINTAINING.md`.

### Backlog cleanup (separate commit / follow-up, repo-only)
- [x] Fix block-id table in `docs/project/ARCHITECTURE.md` (`header`→`aiws:header`, …). *(in this PR)*
- [x] Link ADR 0003 from `MAINTAINING.md` (was the orphan `doctor` caught). *(in this PR)*
- [x] Refresh `docs/development/status/PROJECT-STATE.md` (v0.2.0 shipped, ADR 0003 complete, audit-remediation + 0016a done).
- [x] Archive changes 0012–0015 → `changes/archive/` (precedent: move folders, no per-change specs/ duplication); fixed 0013 stale checkbox (reserved-ns guard landed in F2c) + relative-link depth; `doctor` caught + we fixed the ADR 0003 → 0012 link broken by the move.

## 0016b — `aiws-audit` self-audit skill + command (read-only)
- [x] Generated `aiws-audit` skill + `/aiws-audit` command → read-only, dated report under `docs/development/audits/`.
- [x] Registry row (`core`, on-demand) + skill routing; composes `doctor`/`verify`/`reconcile` signals.
- [x] Tests (`audit-skill.test.js`) + regenerated AGENTS.md byte fixtures; `TEMPLATES_VERSION` → 0.50.0; dogfood synced; doctor/verify green.

## 0016c — AGENTS.md split
- [ ] **Deferred** (clarify Q2): revisit only when a new block actually breaches the token budget.

## Verify & archive
- [x] Verified against the spec: doctor 0/0, verify ✔, 120/120 tests, AGENTS.md 5903/6000; first `/aiws-audit`
  report written to `docs/development/audits/2026-06-23-audit.md`; living docs refreshed.
- [x] Archived. **0016c (AGENTS.md split) is deferred to a future change** (not part of 0016's committed scope).
