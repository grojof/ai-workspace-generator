# Proposal: AI-guided install (bootstrap from repo URL)

## Intent

The preferred way to adopt this tool is **"tell the AI the repo URL and let it install everything"**, even from
a machine with no git/Node/npm. Today there's no directive for that, so the AI improvises and may fail. We need
a precise, OS-aware **guided-install playbook** plus a small standing directive, alongside the classic
expert/manual and update paths.

## Scope

### In Scope
- **AGENTS.md (manual region)**: a ~10-line **"Installation & bootstrap"** directive — the canonical flow the AI must follow: detect OS → check `git`/`node`/`npm` → if missing, propose the official per-OS install and **ask before installing** → fetch the latest Release tarball (0007) → `npm i -g <tgz>` → `ai-workspace init`.
- **`INSTALL.md`** (new): the full guided playbook (zero-to-init) + **expert/manual** path (clone → `npm i` → `npm run build` → `npm link`) + **update** path (newer tarball / `git pull && npm run build`).
- **README.md / README.es.md**: short "Install" section linking guided vs expert.
- Cross-link from `docs/project/USAGE.md` (+ `USAGE.es.md`).

### Out of Scope
- Committed per-OS bootstrap scripts (`bootstrap.sh/.ps1`) — deferred (rot + Safety-gate friction).
- Hardcoded install commands/versions — defer to official docs/context7.
- The Release artifact itself (owned by **0007**).

## Approach

A documentation + directive change: the **AI executes** the playbook step-by-step, asking consent before any
system-mutating install (Safety gate). No generator runtime code changes. The "easy" install consumes the
0007 tarball; the expert path stays clone+build.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `AGENTS.md` (manual region) | Modified | Installation & bootstrap directive |
| `INSTALL.md` | New | guided + expert + update playbook |
| `README*.md`, `docs/project/USAGE*.md` | Modified | install sections/links |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Per-OS instructions drift | Med | Defer to official docs/context7; describe intent, not pinned commands |
| Silent system install | Low | Directive mandates "ask before each install" (Safety gate) |
| Directive not seen pre-install | Med | Keep it in AGENTS.md + README so "read repo → install" surfaces it |

## Rollback Plan

Revert the doc/AGENTS.md commit. No runtime code changes → nothing to break.

## Dependencies

- **0007** (Release tarball is the easy-install source).

## Success Criteria

- [ ] From a clean machine + repo URL, the AI can follow the directive to a working `ai-workspace --version`.
- [ ] AGENTS.md carries a concise, always-present bootstrap directive that mandates consent before installs.
- [ ] Guided, expert, and update paths are documented and cross-linked.
