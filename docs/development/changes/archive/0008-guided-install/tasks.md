# Tasks — AI-guided install (bootstrap from repo URL)

## R1 — Bootstrap directive in AGENTS.md
- [x] Added "### Installing & bootstrapping this generator" to the manual Contributor-guide region (after the intro, before Working principles).
- [x] Flow: detect OS → check git/node/npm → if missing propose official per-OS install + **ask first** → install latest Release tarball → `ai-workspace init` → point to `/configure`; links `INSTALL.md`.
- [x] Lean (≈12 lines); `doctor` stays under budget (AGENTS.md 5707/6000).

## R2 — INSTALL.md playbook
- [x] Created `INSTALL.md` (root): Guided (AI-driven) · Expert/from source · Update · Maintainer release pointer.
- [x] Guided: prerequisite checks, per-OS guidance deferring to official docs/context7, consent before install, install tarball, run `init`.

## R3 — No hardcoded OS commands/versions
- [x] Directive + playbook describe *what* to ensure and defer the *how* (no pinned commands/versions).

## Validation
- [x] `npm run build` + `npm test` green (74/74; no code change).
- [x] `ai-workspace doctor` green; AGENTS.md 5707/6000 tokens.
- [x] No README/USAGE edits (0007 owns those); no `TEMPLATES_VERSION` bump (manual region, not a generated block).

## Verify (next)
- [x] `verify-report.md` written.
- [ ] Archive after merge.
