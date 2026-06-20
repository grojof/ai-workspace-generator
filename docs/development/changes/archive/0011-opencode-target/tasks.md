# Tasks — `opencode` target

## R1 — Selectable target
- [x] `src/config/schema.ts`: added `"opencode"` to the `targets` enum.
- [x] `src/commands/init.ts` (×2 multiselect) + casts: offer `opencode`.
- [x] `src/commands/wizard.ts`: widened `WizardInputs.targets` + `SimpleBasics.targets` unions.

## R3 — MCP builder + wiring
- [x] `src/generate/mcp.ts`: `buildOpencodeMcp(ids)` → `{ $schema, mcp }` (OpenCode shape; `command` array).
- [x] `src/generate/index.ts`: write `.opencode/opencode.json` when `targets` includes `opencode` AND `config.mcp.length`.
- [x] `src/i18n/strings.ts`: `opencodeConfig` (en/es).

## R5 — Docs
- [x] `README.md` + `README.es.md`: `opencode` row in targets table + native AGENTS.md/skills note.
- [x] `docs/project/USAGE.md` + `USAGE.es.md`: targets table row + a full **OpenCode** subsection with per-tool notes and a "things to keep in mind" list (config is regenerated, only $schema+mcp, no-MCP ⇒ no file, commands not projected).

## Version + tests
- [x] Bumped `TEMPLATES_VERSION` → 0.35.0.
- [x] `test/generate.test.js`: 2 opencode tests (file present w/ MCP + valid shape + only $schema/mcp + no Claude/Copilot + idempotent; absent w/o MCP).

## Validation
- [x] `npm run build` + `npm test` green (79/79); `ai-workspace doctor` green; idempotency holds; real generation produces a valid `.opencode/opencode.json`.

## Verify (next)
- [x] `verify-report.md` written.
- [ ] Archive after merge.
