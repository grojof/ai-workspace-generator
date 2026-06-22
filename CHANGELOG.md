# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-22

Foundations release (ADR 0003 A–F + generated-harness quality). Existing repos upgrade with
`ai-workspace upgrade` (migrates markers, renames skills/commands, prunes orphans, writes the manifest).

### Added
- **`aiws` namespace + provenance** — every generated artifact is `aiws-*` (skills/commands) / `aiws:*`
  (block ids) and carries `source@version`. `aiws-` marks only content we author; vendored and stack packs
  keep their ecosystem names.
- **Integrity (verifiable, not a lock)** — `generate` writes `.ai-workspace/manifest.json`; `ai-workspace
  verify` / `doctor --strict` recompute and fail on tampering (CI gate); `sync --check` previews self-heal;
  the safety-guard hook also confines edits to base `file` artifacts.
- **Company packs over git** — `company.packs: [git+url#ref]` vendored by `ai-workspace packs sync` (pinned,
  committed), with a reserved-namespace guard; packs declare a `relation` (new / extends / overrides).
- **`ai-workspace reconcile`** — classifies company overlays vs base (unique / redundant / conflict / drift)
  as propose-and-review, surfaced via the `aiws-reconcile` skill.
- **Richer SDD skills** — intent-based descriptions, output templates and quality bars; thin command
  launchers; OpenSpec delta spec format (ADDED/MODIFIED/REMOVED, RFC 2119, GIVEN/WHEN/THEN).

### Changed
- `company` config is now an object (`{ id, packs }`); the bare-string form is still accepted and normalized.
- The Copilot mirror is slimmed to a thin pointer to `AGENTS.md` (single source of truth).

## [0.1.1] - 2026-06-20

### Added
- **`opencode` target** (change 0011) — reads `AGENTS.md` and `.claude/skills` natively; MCP config is
  deep-merged into `.opencode/opencode.json` without clobbering user settings.

## [0.1.0] - 2026-06-20

First tagged release with a prebuilt tarball (`npm i -g …/ai-workspace-generator.tgz`, Node ≥ 20).

### Added
- Public, shared-tools-first baseline of the AI workspace generator: layered instructions, a skills
  catalogue, SDD (`lean`/`reasons`) with `sdd`/`spdd` methodologies, stack skill-packs, MCP wiring,
  living docs, distribution packaging, and an optional `company` overlay extension point.
- **Guided install & config UX** (changes 0007–0010) — prebuilt binary release flow, guided install,
  guided configuration with the user-profile posture, and the tech-selection directive.

### Notes
- This repository is oriented to individual developers (learning, interview prep, training, everyday
  programming) and contains **no business data**. Applying the generator to a company is an optional
  extension point (`company`, `templates/company/`).

[Unreleased]: https://github.com/grojof/ai-workspace-generator/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/grojof/ai-workspace-generator/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/grojof/ai-workspace-generator/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/grojof/ai-workspace-generator/releases/tag/v0.1.0
