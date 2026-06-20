# Exploration: 0008 — AI-guided install (bootstrap from repo URL)

> Status: exploration. No code touched. Running system-package installs is Safety-gate (ask before installing).

## Goal

Preferred mode: **the AI installs the tool for you**. Given only the repo URL, the AI should bootstrap the CLI
end-to-end — even on a machine with **no git / no Node / no npm** — guiding the user per their OS, then run
`ai-workspace init`. Also document the **expert/manual** path and the **update** path. Add a small standing
directive so the AI always has this flow present and doesn't improvise.

## Current State

- No install automation and no install directive. `README.md` / `docs/project/USAGE.md` document usage but the
  bootstrap-from-zero story (install Node/git first, per OS) isn't a directive an AI can reliably follow.
- The CLI needs **Node ≥20** (and **git** to clone, or nothing if it downloads the 0007 tarball).
- This repo's `AGENTS.md` has a **manual "Contributor guide" region** (survives regeneration) — the right home
  for a meta install directive about the generator *itself* (not a generated block for target repos).
- Depends on **0007**: the easiest "install from zero" fetches the latest **Release tarball**, so the AI can
  `npm i -g <tgz-url>` without cloning/building.

## Affected Areas

- `AGENTS.md` (manual region) — concise **"Installation & bootstrap"** directive (the playbook in ~10 lines).
- `INSTALL.md` (new) or a section in `docs/project/USAGE.md` (+ `USAGE.es.md`) — full guided playbook + expert + update.
- `README.md` / `README.es.md` — link the two install paths.
- (Optional) `scripts/bootstrap.{sh,ps1}` — per-OS helper; or skip in favor of an AI-followed playbook.

## Approaches

1. **AI-followed playbook (docs + AGENTS.md directive), no scripts.** A precise, OS-aware sequence the AI
   executes: detect OS → check `git`/`node`/`npm` → if missing, propose the official install per OS (defer
   exact commands to context7/official docs, **ask before installing**) → fetch latest Release tarball (0007)
   → `npm i -g <tgz>` → `ai-workspace init`. Expert path = clone + `npm i` + `npm run build` + `npm link`.
   Update = re-fetch newer tarball / `git pull && npm run build`.
   - Pros: matches "the AI installs it"; nothing brittle to maintain; respects Safety gate (consent per step); works cross-OS via the AI's judgement + context7.
   - Cons: relies on the AI reading the directive; no one-command script.
   - Effort: **Low** (docs + a short directive).
2. **Playbook + committed per-OS bootstrap scripts.** Add `bootstrap.ps1` / `bootstrap.sh` that automate the checks/install.
   - Pros: one-command for power users.
   - Cons: per-OS scripts rot; hardcoding install commands fights the "no hardcoded versions" rule; more surface to test.
   - Effort: Medium.

## Recommendation

**Option 1.** Ship a tight **guided-install playbook** (INSTALL doc) + a ~10-line **AGENTS.md directive** so the
AI always knows: *prereq check → OS-guided install (ask first) → fetch 0007 tarball → `init`*, plus the expert
and update paths. Skip committed shell scripts for now (rot + Safety-gate friction); the AI-followed flow is
exactly the "let the AI install it" UX the user wants. Defer optional scripts.

## Risks

- **Per-OS install drift** — mitigate: defer to official docs/context7, never hardcode versions; the directive
  describes *what* to ensure, not pinned commands.
- **Safety gate** — installing Node/git or `-g` packages mutates the system → the AI must **ask before each
  install**, never silently. Bake that into the directive.
- **Directive discoverability** — the AI only sees it after fetching the repo; keep it in AGENTS.md + README so
  a "read the repo, then install" step surfaces it. Depends on 0007 tarball existing.

## Ready for Proposal

**Yes.** Propose 0008 around the AI-followed playbook + AGENTS.md directive + expert/update docs; sequence
**after 0007** (the tarball is the install source). Optional scripts explicitly out of scope for v1.
