# Contributing

Thanks for improving `ai-workspace`. Start here, then dive into the docs.

## Read first
- [docs/project/ARCHITECTURE.md](docs/project/ARCHITECTURE.md) — how the generator works.
- [docs/project/EXTENDING.md](docs/project/EXTENDING.md) — how to add languages, frameworks, MCPs, skills, targets, commands.
- [docs/project/MAINTAINING.md](docs/project/MAINTAINING.md) — versioning, the upgrade flow, gotchas, release checklist.

## Setup
```bash
npm install
npm run build                          # tsc → dist/
git config core.hooksPath .githooks    # enforce the commit policy (no Co-Authored-By, Conventional)
```

> The `commit-msg` hook in `.githooks/` is the same one the generator emits — we dogfood it so this
> repo's own commits follow the policy in [AGENTS.md](AGENTS.md). To exercise generation, run
> `npm run dev -- init` / `sync` against a **scratch repo** (this repo intentionally keeps a hand-written
> `AGENTS.md`; it is a CLI, not a generated workspace).

## Before opening a PR
- `npm run build` is clean.
- A second `sync` on a scratch repo reports **0 created, 0 updated** (idempotent).
- Manual text outside `ai-workspace:begin/end` markers survives a `sync`.
- If you changed generated output, bump `TEMPLATES_VERSION` in `src/version.ts`.
- If you renamed/removed a managed-block id, document the migration (see MAINTAINING).
- Update the relevant doc under `docs/project/` in the same PR.

## Principles
- **AGENTS.md is the single source of truth.** New targets are projections of it, never a second source.
- **Additive over breaking.** Prefer new blocks/templates to renaming existing ones.
- **Token-efficient by default.** Keep AGENTS.md lean; push detail into on-demand skills/instructions.
