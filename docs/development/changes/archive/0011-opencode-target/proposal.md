# Proposal: `opencode` target

## Intent

OpenCode (open-source terminal AI agent) reads `AGENTS.md` natively and discovers skills from `.claude/skills/`
— so most of this generator's output already works there. Add `opencode` as a first-class `target` so the one
missing piece (MCP wiring) is generated too, and the support is explicit, documented and tested.

## Scope

### In Scope
- Add `"opencode"` to the `targets` enum and the wizard (Simple + Advanced multiselect).
- `buildOpencodeMcp(ids)` in `src/generate/mcp.ts` → a JSON `{ $schema, mcp }` using OpenCode's shape
  (`type: "local"`, `command: [...]`, `enabled: true`).
- When `targets` includes `opencode` **and** MCP is non-empty, write a dedicated, tool-owned
  `.opencode/opencode.json` (deterministic `writeFile`; deep-merges with the user's own config — no clobber).
- `i18n` description string; targets table rows in `README*` / `USAGE*`; a generation test (mirror codex).
- Document that AGENTS.md + `.claude/skills/` are consumed natively by OpenCode (no extra emission).

### Out of Scope
- Projecting slash commands (`/sdd-*`, `/commit`) to `.opencode/command/<name>.md` (follow-up).
- Re-emitting skills (already read from `.claude/skills/`).
- Any change to AGENTS.md composition (it's shared, unchanged).

## Approach

Mirror the **codex** target (change 0006): AGENTS.md is the instructions adapter (already always generated);
a small tool-native config file declares MCP. Reuse the `mcp.ts` REGISTRY + builder pattern. Only emit the
config when MCP is configured.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/config/schema.ts` | Modified | `targets` enum + `opencode` |
| `src/commands/init.ts`, `wizard.ts` | Modified | offer `opencode` |
| `src/generate/mcp.ts` | Modified | `buildOpencodeMcp` |
| `src/generate/index.ts` | Modified | write `.opencode/opencode.json` (gated) |
| `src/i18n/strings.ts` | Modified | description |
| `README*`, `docs/project/USAGE*` | Modified | targets table |
| `test/generate.test.js` | Modified | opencode target test |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `.opencode/opencode.json` not picked up | Low | context7 confirms `.opencode/` is loaded + deep-merged; verify in apply |
| Invalid config key | Low | Emit only `$schema`/`mcp` (unknown keys error in OpenCode) |
| Idempotency | Low | Deterministic `writeFile` of a tool-owned file (same as codex) |

## Rollback Plan

Revert the commit. `targets` is additive; existing configs (no `opencode`) are unaffected.

## Dependencies

- None. Independent, additive.

## Success Criteria

- [ ] `targets: [opencode]` with context7 generates `AGENTS.md` + `.opencode/opencode.json` (valid `mcp`), and nothing Claude/Copilot/Codex-specific.
- [ ] Empty MCP ⇒ no `.opencode/opencode.json` (AGENTS.md alone).
- [ ] Idempotent second `sync`; `doctor` + `npm test` green.
- [ ] Docs explain AGENTS.md + `.claude/skills/` are read natively by OpenCode.
