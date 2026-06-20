# Exploration: 0011 — `opencode` target

> Status: exploration. No code touched. Facts on OpenCode confirmed via context7 (`/anomalyco/opencode`,
> High reputation) — sources cited inline.

## Goal

Add `opencode` to the `targets` axis so the generator projects its single source of truth onto **OpenCode**
(open-source, provider-agnostic terminal AI agent), mirroring the existing **codex** target (change 0006:
"AGENTS.md adapter + a tool-native config file").

## Current State

- `targets` = `claude | copilot | codex` (`src/config/schema.ts`). `AGENTS.md` is **always** generated and is
  the canonical source; each target is a projection (never a second source).
- MCP plumbing is centralized: `src/generate/mcp.ts` has a `REGISTRY` (context7 = `npx -y @upstash/context7-mcp`)
  and one builder per tool — `buildClaudeMcp` (`.mcp.json`), `buildVscodeMcp` (`.vscode/mcp.json`),
  `buildCodexMcp` (`.codex/config.toml`).
- The **codex precedent** (the blueprint): `src/generate/index.ts:193-195` writes `.codex/config.toml` with a
  plain `writeFile` — a fully-generated, deterministic, tool-owned file (idempotent by construction). AGENTS.md
  is its instructions; the config only declares MCP.

## OpenCode facts (context7-verified)

1. **AGENTS.md is read with zero config.** OpenCode's default `instructions` include `"AGENTS.md"`, and its
   docs say creating an `AGENTS.md` provides custom instructions (rules.mdx). → all governance transfers as-is.
2. **Skills already work — no projection needed.** OpenCode searches multiple skill locations **including
   `.claude/skills/<name>/SKILL.md`** (skills.mdx: "Project Claude-compatible"). The generator already emits
   `.claude/skills/` in the exact `SKILL.md` format → **OpenCode reads them natively, zero work**.
3. **Config is deep-merged; no clobber required.** OpenCode loads + **deep-merges** config across scopes
   (global `~/.config/opencode/…` then project), loading both `opencode.json` and `opencode.jsonc`, with
   project taking precedence (config.ts). So a **dedicated tool-owned `.opencode/opencode.json`** merges with a
   user's root `./opencode.json` instead of overwriting it. Caveat: "Unknown top-level keys … cause
   ConfigInvalidError" → only emit valid keys (`$schema`, `mcp`, optional `instructions`).
4. **MCP shape:** `mcp: { context7: { type: "local", command: ["npx","-y","@upstash/context7-mcp"], enabled: true } }`
   (remote variant uses `type: "remote"`, `url`, `headers`). Maps cleanly from the REGISTRY (`command` + `args`
   → a single `command` array).

## Affected Areas

- `src/config/schema.ts` — add `"opencode"` to the `targets` enum.
- `src/commands/init.ts` (×2 multiselect) + `src/commands/wizard.ts` type — offer `opencode`.
- `src/generate/mcp.ts` — new `buildOpencodeMcp(ids)` → `{ $schema, mcp }` JSON.
- `src/generate/index.ts` — when `targets.includes("opencode")` and MCP is non-empty, `writeFile(".opencode/opencode.json", …)`.
- `src/i18n/strings.ts` — a description string (like `codexConfig`).
- `src/commands/doctor.ts` — optional opencode check.
- Docs (`README*`, `USAGE*` targets table) + a test (mirror the codex target test).

## Approaches

1. **Mirror the codex target: AGENTS.md (already emitted) + a dedicated `.opencode/opencode.json` MCP file.**
   Skills/commands rely on OpenCode's native `.claude/skills/` discovery (documented, not re-emitted).
   - Pros: tiny, deterministic, idempotent (own a dedicated file → no clobber thanks to deep-merge); reuses all
     existing plumbing; skills work for free.
   - Cons: project `command`s (`/sdd-*`, `/commit`) aren't projected to OpenCode's command format (v1 gap).
   - Effort: **Low**.
2. **Also project commands to `.opencode/command/<name>.md`.** Adds OpenCode-native slash commands.
   - Pros: full parity. Cons: more surface + a second format to maintain; commands already exist as prose the
     agent can run. Effort: Medium.

## Recommendation

**Approach 1.** Emit AGENTS.md (already done) + a dedicated `.opencode/opencode.json` with `$schema` + `mcp`
(only when MCP is configured; empty MCP ⇒ emit nothing, AGENTS.md alone suffices). Document that skills are
read natively from `.claude/skills/`. Defer command projection (Approach 2) to a follow-up if wanted. Optional:
add an `instructions` glob list for multi-repo.

## Risks

- **Exact merge path.** Confirmed `.opencode/` project config is loaded + deep-merged; verify during apply with
  a quick `opencode` run/read that `.opencode/opencode.json` is picked up (fallback: root `opencode.json` with
  a read-merge-write to avoid clobber).
- **Schema validity.** Stick to `$schema`/`mcp`/`instructions`; unknown keys raise `ConfigInvalidError`.
- **Idempotency.** A deterministic `writeFile` of a tool-owned file holds the invariant (like codex).

## Ready for Proposal

**Yes.** Low-effort, high-value, no architecture change. Two open questions are already resolved by context7
(skills work natively; deep-merge avoids clobber). Recommend proposing Approach 1.
