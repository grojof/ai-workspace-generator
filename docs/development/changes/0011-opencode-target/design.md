# Design — `opencode` target

## Overview

Mirror the codex target: AGENTS.md is the instructions adapter (already always emitted); a tool-native config
file declares MCP. Reuse the `mcp.ts` REGISTRY + builder pattern and the `index.ts` per-target wiring.

## Changes

### 1. Schema — `src/config/schema.ts`
- Add `"opencode"` to the `targets` enum (`["claude","copilot","codex","opencode"]`).

### 2. Wizard — `src/commands/init.ts` (×2), `src/commands/wizard.ts`
- Add `{ value: "opencode", label: "OpenCode", hint: "AGENTS.md + .opencode/opencode.json (MCP)" }` to both
  target multiselects.
- Widen the `targets` casts to include `"opencode"` (init.ts) and the `WizardInputs.targets`/`SimpleBasics`
  union in wizard.ts.

### 3. MCP builder — `src/generate/mcp.ts`
- `buildOpencodeMcp(ids: string[]): string` → `JSON.stringify({ $schema: "https://opencode.ai/config.json",
  mcp }, null, 2)` where each server is `{ type: "local", command: [def.command, ...def.args], enabled: true,
  ...(def.env ? { env: def.env } : {}) }`. Deterministic key order.

### 4. Wiring — `src/generate/index.ts`
- After the codex block, add:
  ```ts
  if (config.targets.includes("opencode") && config.mcp.length) {
    add(writeFile(resolve(cwd, ".opencode/opencode.json"), buildOpencodeMcp(config.mcp)), t.desc.opencodeConfig);
  }
  ```
  Gated on non-empty MCP (empty ⇒ AGENTS.md alone). Tool-owned file → deep-merges with the user's config.

### 5. i18n — `src/i18n/strings.ts`
- Add `opencodeConfig` (en/es), e.g. "MCP servers for OpenCode (.opencode/opencode.json; AGENTS.md is its instructions)."

### 6. Docs + tests
- `README.md`/`README.es.md` + `docs/project/USAGE.md`/`USAGE.es.md`: add an `opencode` row to the targets
  table and a one-liner that AGENTS.md + `.claude/skills/` are read natively.
- `test/generate.test.js`: a test mirroring the codex one — `targets: [opencode]` + context7 ⇒ AGENTS.md +
  `.opencode/opencode.json` with the right `mcp`; empty MCP ⇒ no file; second generate idempotent; no
  Claude/Copilot files.

## Why this approach
- Smallest projection that closes the only real gap (MCP). AGENTS.md and skills are already consumed by
  OpenCode, so re-emitting them would be redundant. A dedicated tool-owned file leverages OpenCode's deep-merge
  to avoid clobbering user settings.

## Risks / mitigations
- **Pickup of `.opencode/opencode.json`** — context7 confirms `.opencode/` project config is loaded + merged;
  spot-check during apply. Fallback: root `opencode.json` with read-merge-write.
- **Invalid keys** — emit only `$schema` + `mcp`.
- **Idempotency** — deterministic `writeFile` (same guarantee as `.codex/config.toml`).
- **No `TEMPLATES_VERSION` bump needed?** AGENTS.md output is unchanged; but new generated artifact + wizard →
  bump `TEMPLATES_VERSION` to be safe (generated surface changed).
