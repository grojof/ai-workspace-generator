# Spec — AI-guided install (bootstrap from repo URL)

Requirements use MUST/SHOULD. Documentation + directive change; no generator runtime code.

## R1 — Standing bootstrap directive in AGENTS.md
The generator's own `AGENTS.md` (manual "Contributor guide" region) MUST carry a concise directive describing
the canonical install flow, so any AI told *"install this from &lt;URL&gt;"* follows it instead of improvising.

- **Given** the manual region of `AGENTS.md`, **then** it contains an "Installing & bootstrapping this
  generator" subsection: detect OS → check `git`/`node`/`npm` → if missing, propose the official per-OS install
  and **ask before installing** → install the latest Release tarball (0007) → run `ai-workspace init`.
- **Given** that directive, **then** it explicitly mandates asking consent before any system-mutating install
  (Safety gate) and points to `INSTALL.md` for the full playbook.

## R2 — INSTALL.md guided playbook
A root `INSTALL.md` MUST document the full zero-to-init flow for the **guided**, **expert/manual**, and
**update** paths.

- **Given** `INSTALL.md`, **then** the **guided** path covers prerequisite checks, per-OS install guidance
  (deferring exact commands to official docs/context7, never hardcoding versions), installing the Release
  tarball, and running `init`.
- **Given** `INSTALL.md`, **then** the **expert** path documents clone → `npm install && npm run build &&
  npm link`, and the **update** path documents re-installing the newer tarball / `git pull && npm run build`.
- **Given** the guided path, **then** it states that installing system packages requires the user's consent.

## R3 — No hardcoded per-OS commands / versions
The docs MUST NOT pin OS-specific install commands or tool versions; they describe *what* to ensure and defer
the *how* to official sources.

- **Given** a missing prerequisite, **then** the directive/playbook tells the agent to consult official
  docs/context7 for the user's OS rather than running a hardcoded command.

## Out of scope
- Committed per-OS bootstrap scripts (`bootstrap.sh/.ps1`).
- Editing the README/USAGE install sections (owned by change 0007); `INSTALL.md` is linked, not duplicated.
- The Release artifact itself (change 0007).

## Acceptance summary
`AGENTS.md` carries an always-present bootstrap directive that mandates consent before installs and points to
`INSTALL.md`; `INSTALL.md` documents guided + expert + update without hardcoding OS commands/versions. No
runtime code changes; `doctor` stays green (AGENTS.md within token budget).
