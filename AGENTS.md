# ai-workspace — AGENTS.md

Guidance for AI agents working on **this generator itself** (it is a CLI, not a generated workspace).
Dogfooding: the tool that scaffolds AI workspaces keeps its own.

## What this project is
A Node/TypeScript CLI that scaffolds and adapts an AI workspace (Claude Code + Copilot) for any repo.
One input — `workspace.config.yaml` — plus a layered template library produce a canonical `AGENTS.md`
and tool adapters, written idempotently via managed regions. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Conventions (Layer 0)
- TypeScript strict, ESM (`NodeNext`). Import specifiers use `.js` extensions (compiled output).
- Named exports; small, single-purpose modules. Match surrounding style.
- UTF-8, LF, final newline. Conventional Commits, imperative mood.
- Comments explain *why*, not *what*. Keep them sparse and high-value.

## Architecture rules (do not break these)
- **`AGENTS.md` is the single source of truth** for generated repos. New targets are *projections* of the
  same composed blocks — never a second source.
- **Managed-region block ids are a stable contract.** Renaming/removing an id orphans content in users'
  repos (writeManaged never deletes unknown blocks). Prefer changing content over ids; document migrations.
- **Idempotency is sacred.** A second `generate`/`sync` must report 0 created, 0 updated. Text outside
  `ai-workspace:begin/end` markers must always survive.
- **The CLI never calls MCP servers.** context7 is for the *agent*; anything needing live docs goes into a
  generated prompt/skill (see `import` → `docs/ai/INGEST-RECONCILE.md`), not CLI code.
- **i18n:** human-facing content respects `config.language`. Templates resolve `templates/i18n/<locale>/`
  with English fallback; short strings live in `src/i18n/strings.ts`.

## Where things live
| To change… | Edit… |
|------------|-------|
| A rule's wording | the `.eta` in `templates/` (+ `templates/i18n/es/`) |
| Available modules | `src/modules/registry.ts` (+ `src/generate/mcp.ts`) |
| Which blocks exist / order | `composeBlocks` in `src/generate/agents.ts` |
| Files written & how | `src/generate/*.ts` |
| Config shape / defaults | `src/config/schema.ts` |

## Workflow
- For non-trivial changes, read [docs/EXTENDING.md](docs/EXTENDING.md) and [docs/MAINTAINING.md](docs/MAINTAINING.md) first.
- Run `npm run build` and `npm test` before finishing. Invariants: idempotency holds; bundled modules
  have base + Spanish templates; `doctor` stays green.
- Bump `TEMPLATES_VERSION` in `src/version.ts` when generated output changes (the project is pre-release;
  skip the bump only while it's not in use).
- Update the matching doc (`docs/` and `docs/es/`) in the same change.

## Commits
- Conventional Commits, imperative. One logical change per commit. The user's own git identity; no
  `Co-Authored-By` trailers. Never use `--no-verify`.
