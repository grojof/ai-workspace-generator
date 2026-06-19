# Tasks — Codex target + editor configurability

- [x] **R1a** `targets` enum gains `codex`; `vscode: boolean` (default true) in `src/config/schema.ts`.
- [x] **R1b** `buildCodexMcp(ids)` (TOML) in `src/generate/mcp.ts`; `.codex/config.toml` write in
      `generateWorkspace` when `codex` target (`t.desc.codexConfig`).
- [x] **R2** Gate `.vscode/mcp.json` + `generateVscode(...)` on `config.vscode` in `src/generate/index.ts`.
- [x] **R3a** `wizard.ts`: targets include codex; `vscode` in `WizardInputs`/`buildConfig`; `simpleDefaults`
      sets `vscode: true`.
- [x] **R3b** `init.ts`: targets multiselect offers Codex (Simple + Advanced); Advanced asks `.vscode`.
- [x] **R3c** `guides.ts` `configure-workspace` skill body mentions Codex target + `vscode` flag.
- [x] **R3d** `strings.ts` `desc.codexConfig`.
- [x] **Docs** `docs/project/USAGE.md`: Targets (claude/copilot/codex), `vscode` flag, Copilot-in-Visual
      Studio toggle.
- [x] **Tests**: codex target (TOML, no Claude/Copilot/.vscode when codex-only; context7 off), `vscode:false`
      omits `.vscode/*`, idempotency. **74/74**.
- [x] Bumped `TEMPLATES_VERSION` 0.31.0 → 0.32.0; doc-sync (PROJECT-STATE), spec folded, verify-report.
- [x] Archived.
- [ ] Root README restructure (separate commit) + commit + PR.
