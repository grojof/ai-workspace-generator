# Exploration: 0016 — Documentation coherence & self-audit

> Born from the June 2026 audit of the repo at v0.2.0. The audit found that *coherence drifts because nothing
> enforces it*: the harness preaches standards the repo doesn't meet, living docs go stale, completed SDD
> changes aren't archived, and stray/legacy files (the self-plugin, a dead `INGEST-RECONCILE.md` reference)
> accumulate unnoticed. The fix is not another rule in `AGENTS.md` — it's a **self-feeding coherence
> capability** that any generated workspace (this repo first, by dogfood) gets for free.

## Goal

Make a generated AI workspace **keep itself coherent and audit itself over time**, so the kind of drift the
audit found is *detected automatically* instead of by luck. Three capabilities:

1. **A doc-structure contract** — a declared "minimum doc map": which docs must exist, where, who owns them,
   and their kind (authored / generated / byte-for-byte). The source of truth for what *should* be there.
2. **Coherence checks in `doctor`** — detect **dangling references** (a doc/skill pointing at a path that
   doesn't exist) and **orphan files** (a doc that nothing links to and the contract doesn't declare), and
   extend living-docs/`doc-sync` to cover **`docs/project/`**, not just `docs/development/status/`.
3. **A periodic self-audit** — a generated `aiws-audit` skill/command that regenerates the audit report from
   the workspace's *own current state* (the differentiator: workspaces that critique themselves).

## Current state / affected areas

**`doctor` ([src/commands/doctor.ts](../../../../src/commands/doctor.ts))** checks: AGENTS.md present + token
budget, orphaned managed blocks, CLAUDE.md / copilot present, stack ids known to the registry, commit-msg
hook. It does **not** check dangling references, orphan files, or anything under `docs/`.

**Living docs ([src/generate/livingDocs.ts](../../../../src/generate/livingDocs.ts))** only seed/refresh
`docs/development/status/PROJECT-STATE.md` + `ARCHITECTURE.md`. The `doc-sync` command/skill points only
there. `docs/project/` (USAGE, EXTENDING, MAINTAINING, DISTRIBUTION, ARCHITECTURE, decisions…) is **hand-
authored and unmanaged** — exactly where this audit found drift (the stale `MAINTAINING` plugin section).
`config.docs.project` already exists in [paths.ts](../../../../src/generate/paths.ts) but nothing maintains it.

**No structure contract exists.** Nothing declares the expected doc layout, so a stray file (top-level
`commands/aiws.md`, a dead `INGEST-RECONCILE.md` link) is invisible to tooling. The integrity **manifest**
(Part E) tracks *base artifacts* by hash but says nothing about *docs* or *references between files*.

**AGENTS.md is at ~5875/6000 tokens (98%)** — `doctor` warns past budget, but the file is one monolith;
the next core block breaks it. The architecture already supports progressive disclosure (skills, `references/`)
but the governance spine itself isn't split.

**Audit cleanup backlog** (housekeeping this change should also clear): archive completed changes 0012–0015
into `specs/` + `archive/`; refresh `PROJECT-STATE.md` (stale at 0.46.0 / "dogfood pending"); fix the
block-id table in `docs/project/ARCHITECTURE.md` (`header`→`aiws:header`).

## Approaches

Split along risk, like 0013 (F1a/F1b):

- **0016a — Coherence checks + structure contract (low/med risk).** Add a declared doc map (in
  `workspace.config.yaml` or a generated `docs/INDEX.md` contract) + `doctor` checks for dangling refs and
  orphans + extend `doc-sync`/living-docs to cover `docs/project/`. Clear the cleanup backlog here. Mechanical,
  high coherence payoff, would have caught every finding in this audit.
- **0016b — `aiws-audit` self-audit skill/command (med risk, the differentiator).** A generated skill that
  reads the workspace state (doctor + verify + reconcile + the doc contract) and emits a prioritized audit
  report — the "periodic self-improvement" loop. New skill in the registry + routing + byte fixtures.
- **0016c — AGENTS.md optimization / split (high risk: single-source + byte-fixture + token contract).**
  Move detail out of the spine into on-demand `references/` while keeping `AGENTS.md` the single source.
  Touches `BLOCK_MANIFEST`, every byte fixture, and the token-budget invariant. Do last, on its own.

## Key decisions to settle in the proposal

- **Where the doc contract lives:** generated `docs/INDEX.md` (human + agent readable, fits "docs are
  Markdown") vs a `docs:` section in `workspace.config.yaml` (machine-first, easier for `doctor`). Likely the
  config drives it and a generated index mirrors it.
- **Orphan detection scope:** how to avoid false positives on legitimately-unlinked files (e.g. `SECURITY.md`,
  `LICENSE`). The contract should *whitelist* the known roots; "orphan" = under `docs/` and neither linked nor
  declared.
- **`aiws-audit` output:** a transient report (stdout, like `doctor`) vs a written artifact under
  `docs/development/` (reviewable, self-feeding). Audit recommends written + dated, so improvements compound.
- **AGENTS.md split granularity (0016c):** which layers stay inline (Layer 0 governance) vs move to
  `references/` (language/framework detail). Must not regress the single-source contract.
- **Generator feature vs repo housekeeping:** 0016a/b ship as *generator capabilities* (every workspace
  benefits, dogfooded here); the backlog cleanup is repo-only. Keep them in separate commits.

## Risks

- **Byte-fixture churn (med→high).** New generated skill (0016b) + any AGENTS.md split (0016c) regenerate
  fixtures and bump `TEMPLATES_VERSION` — deliberate, byte-equivalent where claimed.
- **False positives in coherence checks (med).** A too-aggressive dangling-ref/orphan check creates noise and
  erodes trust; must be conservative and whitelist-driven, with `doctor` warn (not error) until proven.
- **Single-source regression (high, 0016c).** Splitting AGENTS.md risks fragmenting the source of truth or
  breaking idempotency/managed-region contracts. Gate behind tests; smallest viable split first.
- **Scope creep (med).** This change is a magnet for "while we're here". Keep 0016a shippable on its own.

## Ready for proposal

**Yes.** Recommend **0016a first** (contract + coherence checks + `docs/project` coverage + clear the audit
backlog) — it directly prevents recurrence and is low-risk. Then **0016b** (`aiws-audit`, the self-feeding
differentiator). **0016c** (AGENTS.md split) last, on its own, behind the token + single-source tests.
