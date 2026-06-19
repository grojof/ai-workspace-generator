# Proposal — Codex target + editor (.vscode) configurability

## Intent
Add **OpenAI Codex** as a first-class target and make the **`.vscode/`** output optional, so the workspace
fits users on Codex and/or Visual Studio (not just VS Code). This leans on the project's core idea —
`AGENTS.md` is the single source of truth and targets are projections — and on the fact (verified vs the
Codex docs) that **Codex reads `AGENTS.md` natively**, so its adapter already exists.

No new stack/language work: arbitrary stack ids already produce generic blocks, and users extend per-project
with the AI skills (`configure-workspace`, `find-skills`, `skill-creator`). Rich VB.NET/WebForms templates are
intentionally out of scope.

## Scope
- **R1 — Codex target.** Add `"codex"` to `targets`. `AGENTS.md` (already generated) is its instructions
  file; additionally emit **`.codex/config.toml`** with MCP servers (TOML, project-scoped) when `codex` is a
  target and there are servers. `targets: ["codex"]` alone ⇒ just `AGENTS.md` (+ `.codex/config.toml`).
- **R2 — `.vscode/` optional.** New config flag `vscode: boolean` (default **true** → unchanged). When
  `false`, skip `.vscode/extensions.json`, `.vscode/settings.json` and `.vscode/mcp.json`. The wizard asks it
  (Advanced) and the AI-guided `configure-workspace` skill decides/asks it.
- **R3 — Wiring + docs.** Wizard `targets` multiselect offers Codex; the `configure-workspace` skill knows
  about Codex + the `.vscode` flag. Document that **GitHub Copilot in Visual Studio** already reads
  `.github/copilot-instructions.md` / `instructions/*.instructions.md` (enable the Tools→Options toggle).

## Out of scope
- VB.NET / ASP.NET WebForms / .NET stack templates and detection (rely on generic blocks + AI skills).
- A Codex "skills/slash-command" projection (Codex has no skills system; the methodology lives in AGENTS.md).
- Per-IDE settings beyond the `.vscode` on/off switch.

## Risks
- **Backward compatibility.** `vscode` defaults true and `codex` is additive, so existing single-repo output
  is byte-identical. *Mitigation:* keep defaults; golden + idempotency tests.
- **Codex config drift.** `.codex/config.toml` is project-scoped and only declares `[mcp_servers]`; it does
  not fight the user's `~/.codex/config.toml`. *Mitigation:* emit only the MCP table; deterministic TOML.

## Acceptance
- `targets` accepts `codex`; a codex target emits `.codex/config.toml` (context7 in TOML) and relies on
  `AGENTS.md`; `targets: ["codex"]` produces no `CLAUDE.md`/Copilot files.
- `vscode: false` omits all `.vscode/*`; default `true` is unchanged.
- Wizard offers Codex + asks about `.vscode`; `configure-workspace` mentions both; USAGE documents Codex +
  the Visual Studio Copilot toggle.
- `npm run build` + full suite green; second `sync` idempotent.
