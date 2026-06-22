# Clarify: 0016 — Documentation coherence & self-audit

Resolved ambiguities before spec (decisions by the maintainer, 2026-06-22).

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | `aiws-audit` behaviour in v1 | **Read-only, written + dated report** (no auto-fix) | Safe, simple, composes existing read-only signals. Propose-and-review (like `reconcile`) is a later iteration once the report proves useful. |
| Q2 | AGENTS.md split (0016c) now or later | **Defer 0016c** | The single-source + byte-fixture + token-budget risk isn't justified until a concrete new block actually breaches the budget. `doctor` already warns at the threshold. |
| D3 | Contract location | **Config-driven (`docs.contract`) + generated `docs/INDEX.md` mirror** | Machine-first for checks; human/agent-readable index, consistent with "docs are Markdown". |
| D4 | Orphan-detection scope | **Only files under `docs/`; whitelist repo roots** (`README`, `LICENSE`, `SECURITY`, `CHANGELOG`, `CONTRIBUTING`). `warn`, never `error` | Avoid false positives that erode trust in the check. |

## Net scope after clarify

- **0016a** (ship first): doc contract + `doctor` coherence checks (dangling refs + orphans, `warn`) +
  `doc-sync` covers `docs/project/` + clear the audit backlog (archive 0012–0015, refresh PROJECT-STATE, fix
  ARCHITECTURE block-id table).
- **0016b**: generated `aiws-audit` skill + `/aiws-audit` command → read-only dated report.
- **0016c**: **deferred** (not in this change).
