# Design — AI-guided install (bootstrap from repo URL)

## Overview

A docs + directive change so an AI can install the generator from just a repo URL, even on a bare machine.
No generator runtime code. Two deliverables: a standing directive in `AGENTS.md` (manual region) and a root
`INSTALL.md` playbook. README/USAGE install sections are owned by change 0007 and are not edited here (avoids
divergence with the open 0007 PR); `INSTALL.md` is the canonical, linkable playbook.

## Changes

### 1. `AGENTS.md` — bootstrap directive (manual "Contributor guide" region)
- Insert a short subsection "### Installing & bootstrapping this generator" right after the region intro
  (line ~285), before "### Working principles".
- Content (~12 lines, lean to respect the doctor token budget): the canonical flow — detect OS → check
  `git`/`node`/`npm` → if missing, propose the official per-OS install and **ask first** → install the latest
  Release tarball → `ai-workspace init` (then point to `/configure` for the rich config) → link `INSTALL.md`.
- It lives in the manual region, so it survives `sync` and is not a generated block (no `TEMPLATES_VERSION`
  bump, no block-manifest change).

### 2. `INSTALL.md` (new, repo root)
- Sections: **Guided (AI-driven)**, **Expert / from source**, **Update**, and a short **Maintainer: cut a
  release** pointer (to `scripts/release.mjs`, from 0007).
- Guided path = the step-by-step an AI follows: prerequisite checks; per-OS install guidance that **defers to
  official docs/context7** (no hardcoded commands/versions); **consent before any install** (Safety gate);
  install the Release tarball (`npm i -g <latest-download URL>`); run `ai-workspace init`.
- Expert = clone → `npm install && npm run build && npm link`. Update = re-install newer tarball /
  `git pull && npm run build`.

## Why this approach
- The directive is the durable, always-loaded steer (AGENTS.md is the source of truth); `INSTALL.md` holds the
  detail on demand (progressive disclosure). No brittle shell scripts to rot.
- Keeping README/USAGE untouched here prevents conflicts with the in-flight 0007 PR and keeps "one logical
  change".

## Risks / mitigations
- **AGENTS.md token budget** — keep the directive ~12 lines; verify `doctor` stays < 6000 tokens.
- **Per-OS drift** — defer to official docs/context7; never pin commands/versions.
- **Discoverability before install** — the directive sits in AGENTS.md and links INSTALL.md; 0007's README note
  ("tell your AI to install from URL") is the entry hook once both merge.
- **Depends on 0007** — the tarball/Release is the install source; this change assumes it exists (it does:
  Release v0.1.0 is live).
