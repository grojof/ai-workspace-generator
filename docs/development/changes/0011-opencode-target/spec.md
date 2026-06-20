# Spec — `opencode` target

Requirements use MUST/SHOULD. Additive target; AGENTS.md composition unchanged.

## R1 — `opencode` is a selectable target
`targets` MUST accept `"opencode"`, selectable in the wizard.

- **Given** `targets: [opencode]`, **when** parsed, **then** the config validates.
- **Given** the `init` wizard, **then** `opencode` appears as a target option (Simple + Advanced).

## R2 — AGENTS.md is the opencode adapter (no new instructions file)
With `opencode` selected, the generator MUST rely on the always-generated `AGENTS.md` (OpenCode reads it
natively) and MUST NOT emit a separate instructions file for it.

- **Given** `targets: [opencode]`, **then** `AGENTS.md` is generated and no Claude/Copilot/Codex-specific
  artifacts are written.

## R3 — MCP projected to `.opencode/opencode.json` (tool-owned, gated)
When `opencode` is selected and MCP is configured, the generator MUST write `.opencode/opencode.json` with
`$schema` and a valid `mcp` block in OpenCode's shape.

- **Given** `targets: [opencode]`, `mcp: [context7]`, **then** `.opencode/opencode.json` contains
  `mcp.context7 = { type: "local", command: ["npx","-y","@upstash/context7-mcp"], enabled: true }` and a
  `$schema`.
- **Given** `mcp: []`, **then** `.opencode/opencode.json` is **not** written (AGENTS.md alone suffices).
- **Given** only valid top-level keys are emitted (`$schema`, `mcp`) so OpenCode does not raise
  `ConfigInvalidError`.

## R4 — Idempotency
A second `generate`/`sync` MUST report 0 created / 0 updated for the opencode artifacts.

- **Given** an unchanged config, **when** generated twice, **then** `.opencode/opencode.json` is unchanged.

## R5 — Documented native reuse
Docs MUST state that OpenCode consumes `AGENTS.md` and the existing `.claude/skills/` natively (no extra
emission), and add `opencode` to the targets table.

## Out of scope
- Projecting commands to `.opencode/command/`.
- Re-emitting skills.

## Acceptance summary
`opencode` is a selectable target; AGENTS.md is its adapter; MCP lands in a tool-owned, deep-merge-safe
`.opencode/opencode.json` only when configured; idempotent; docs explain native AGENTS.md + skills reuse.
Tests + doctor green.
