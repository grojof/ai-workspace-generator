# Contributing

Thanks for improving `ai-workspace`. Start here, then dive into the docs.

## Read first
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the generator works.
- [docs/EXTENDING.md](docs/EXTENDING.md) — how to add languages, frameworks, MCPs, skills, targets, commands.
- [docs/MAINTAINING.md](docs/MAINTAINING.md) — versioning, the upgrade flow, gotchas, release checklist.

## Setup
```bash
npm install
npm run build      # tsc → dist/
npm run dev -- sync
```

## Before opening a PR
- `npm run build` is clean.
- A second `sync` on a scratch repo reports **0 created, 0 updated** (idempotent).
- Manual text outside `ai-workspace:begin/end` markers survives a `sync`.
- If you changed generated output, bump `TEMPLATES_VERSION` in `src/version.ts`.
- If you renamed/removed a managed-block id, document the migration (see MAINTAINING).
- Update the relevant doc in the same PR.

## Principles
- **AGENTS.md is the single source of truth.** New targets are projections of it, never a second source.
- **Additive over breaking.** Prefer new blocks/templates to renaming existing ones.
- **Token-efficient by default.** Keep AGENTS.md lean; push detail into on-demand skills/instructions.
