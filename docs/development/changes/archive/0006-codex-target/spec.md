# Spec — Codex target + editor configurability

> Delta against `docs/development/specs/configuration.md`.

## R1 — Codex target
`targets` MUST accept `"codex"`, and Codex MUST be served by `AGENTS.md` plus an MCP config.

- **Given** `codex` in `targets`, **then** `AGENTS.md` is generated (the Codex instructions file — already
  the single source of truth) and `.codex/config.toml` is written with the configured MCP servers in TOML
  (`[mcp_servers.<id>]` with `command`/`args`).
- **Given** `codex` in `targets` and **no** MCP servers, **then** `.codex/config.toml` is still written with a
  header comment (no servers) — deterministic/idempotent.
- **Given** `targets: ["codex"]` (no claude/copilot), **then** no `CLAUDE.md` and no `.github/copilot-*`
  files are produced; `AGENTS.md` + `.codex/config.toml` are.

## R2 — `.vscode/` optional
A config flag `vscode` (default `true`) MUST gate all `.vscode/` output.

- **Given** `vscode: true` (default), **then** `.vscode/extensions.json`, `.vscode/settings.json` and (when
  copilot is a target) `.vscode/mcp.json` are generated — unchanged from today.
- **Given** `vscode: false`, **then** none of the `.vscode/*` files are written.
- **Given** an existing config without the field, **then** it defaults to `true` (byte-identical output).

## R3 — Wizard + AI skill + docs
- **Given** the `init` wizard, **then** the `targets` multiselect offers Codex, and Advanced asks whether to
  generate `.vscode/` (default yes); Simple uses the default (`true`).
- **Given** the `configure-workspace` skill, **then** its guidance covers the Codex target and the `vscode`
  flag (so the AI-guided path sets them per project).
- **Given** the usage docs, **then** they document the Codex target and that **Copilot in Visual Studio**
  reads `.github/copilot-instructions.md` / `instructions/*.instructions.md` after enabling the
  Tools→Options toggle.

## Acceptance
Codex is a target served by `AGENTS.md` + `.codex/config.toml`; `targets: ["codex"]` yields no Claude/Copilot
files; `vscode:false` omits `.vscode/*` while the default stays byte-identical; wizard + skill + docs cover
both; build + suite green; idempotent.
