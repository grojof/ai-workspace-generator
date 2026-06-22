# Proposal: 0016 — Documentation coherence & self-audit

## Intent

Make a generated workspace **keep itself coherent and audit itself over time**. The June 2026 audit found
that coherence drifts because nothing enforces it: the harness preached standards the repo didn't meet (lint,
`.nvmrc` — fixed in #51), living docs went stale, completed SDD changes weren't archived, and stray files
(self-plugin, a dead `INGEST-RECONCILE.md` link) accumulated unseen. The cure is not another rule in
`AGENTS.md` — it's a **self-feeding capability** every workspace gets (this repo first, by dogfood): the
differentiator is *workspaces that detect their own drift and critique themselves*.

## Scope

Ships in **three reviewable slices** (same change folder, sequential), split by risk:

### 0016a — Doc-structure contract + coherence checks (low/med, ship first)
- **Doc contract:** a declared "minimum doc map" — which docs must exist, where, who owns them, and their
  kind (`authored` / `generated` / `byte-for-byte`). Lives in `workspace.config.yaml` (`docs.contract`,
  machine-first) and is mirrored to a generated `docs/INDEX.md` (human + agent readable).
- **`doctor` coherence checks** (level `warn`, conservative, whitelist-driven):
  - **Dangling references** — a tracked doc/skill linking a workspace-relative path that doesn't exist.
  - **Orphan files** — a file under `docs/` that the contract doesn't declare and nothing links to.
- **`doc-sync` covers `docs/project/`** — living-docs refresh extends beyond `docs/development/status/` to the
  project-facing docs the contract declares (where this audit's drift actually lived).
- **Clear the audit backlog** (repo-only, separate commit): archive 0012–0015 into `specs/` + `archive/`,
  refresh `PROJECT-STATE.md`, fix the block-id table in `docs/project/ARCHITECTURE.md`.

### 0016b — `aiws-audit` self-audit skill + command (med, the differentiator)
- A generated **`aiws-audit`** skill (+ `/aiws-audit` command) that reads the workspace's own state — `doctor`,
  `verify`, `reconcile`, the doc contract — and emits a **prioritized, dated audit report** written under
  `docs/development/` (reviewable + self-feeding, so improvements compound), not just stdout.
- Registry row + skill routing + byte fixtures.

### 0016c — AGENTS.md optimization / split (high, last, on its own)
- AGENTS.md is at ~98% of its token budget. Move **detail** (language/framework specifics) out of the
  governance spine into on-demand `references/`, keeping `AGENTS.md` the single source of truth and Layer 0
  governance inline. Smallest viable split first, behind the token + single-source + idempotency tests.

### Out of scope
- New SDD phases or methodology changes (0012 territory).
- Changing the integrity manifest format (Part E is done); the audit *reads* it, doesn't redefine it.

## Approach

0016a centralizes the contract as config-driven data (like `BLOCK_MANIFEST`): the checks read it, the index
generator mirrors it. The `doctor` checks are pure functions over the filesystem + contract, `warn`-level
until proven low-noise. 0016b composes existing read-only signals (`doctor`/`verify`/`reconcile`) into one
report — no new analysis engine, just aggregation + prioritization. 0016c is mechanical extraction gated by
the existing invariants.

## Affected areas

| Area | Impact |
|------|--------|
| `src/config/schema.ts` | new `docs.contract` (optional, defaulted) |
| `src/commands/doctor.ts` | dangling-ref + orphan checks (warn) |
| `src/generate/livingDocs.ts`, `docsIndex.ts` | `docs/project/` coverage; generated `docs/INDEX.md` |
| `src/generate/skills.ts`, `src/modules/skills.ts`, `skillRouting.ts` | `aiws-audit` skill + registry + routing (0016b) |
| `src/generate/blockManifest.ts` + `templates/` | AGENTS.md split (0016c) |
| `test/__fixtures__/agents/*.md`, byte fixtures | regenerate deliberately (0016b, 0016c); `TEMPLATES_VERSION` bump |
| `docs/development/{specs,changes/archive}/`, `PROJECT-STATE.md`, `docs/project/ARCHITECTURE.md` | backlog cleanup (0016a, repo-only) |

## Recommended decisions (for clarify)

1. **Contract location:** config-driven (`docs.contract`) + generated `docs/INDEX.md` mirror. *(Recommended.)*
2. **Orphan scope:** only flag files **under `docs/`**; whitelist repo roots (`README`, `LICENSE`, `SECURITY`,
   `CHANGELOG`, `CONTRIBUTING`). `warn`, never `error`, until noise is proven low.
3. **Audit output:** a **written, dated artifact** under `docs/development/` (self-feeding), plus a stdout
   summary. *(Recommended over stdout-only.)*
4. **0016c depth:** split out **language/framework** detail only; keep all Layer 0 governance inline. Defer
   deeper restructuring unless the budget still bites.
5. **Sequencing:** 0016a as its own PR (prevents recurrence, low risk), then 0016b, then 0016c. Each is
   independently shippable.

## Open questions (need your call)

- **Q1 (0016b):** should the self-audit be **read-only** (report only) or also **propose fixes**
  (propose-and-review, like `reconcile`)? Read-only is safer and simpler; propose-and-review is more powerful
  but bigger. Recommendation: **read-only report first**, propose-and-review as a later iteration.
- **Q2 (0016c):** is the AGENTS.md split worth the contract risk **now**, or defer until a concrete new block
  actually breaches the budget? Recommendation: **defer 0016c**; ship 0016a + 0016b, revisit the split when the
  budget is genuinely exceeded.
