# SDD upstream provenance

This is the **single source of maintenance truth** for our mixed SDD methodology. We borrow *concepts*
(not code) from two upstream projects — see [ADR 0001](decisions/0001-mixed-sdd.md). When either project
evolves its philosophy, this file is what we reconcile against. Keep it small: concepts, not a fork.

> 🤖 To refresh this file, run the **`/sdd-upstream-check`** command (this repo's `.claude/commands/`).
> The agent fetches each upstream's latest changelog since the *reviewed* date below, flags only
> philosophy-relevant changes, proposes template edits, and bumps `TEMPLATES_VERSION`.

## Tracked upstreams

| Project | Repo | Releases | Last reviewed |
|---------|------|----------|---------------|
| Spec-Kit | https://github.com/github/spec-kit | https://github.com/github/spec-kit/releases | 2026-06-15 (`main`) |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | https://github.com/Fission-AI/OpenSpec/releases | 2026-06-15 (`main`) |

## What we borrowed (the entire replicated surface)

| Concept | From | Upstream anchor | Our implementation | Status |
|---------|------|-----------------|--------------------|--------|
| **Constitution** (project principles) | Spec-Kit (`/speckit.constitution`, `.specify/memory/`) | [spec-kit README](https://github.com/github/spec-kit#readme) | `openspec/constitution.md` seed in [`src/generate/sdd.ts`](../src/generate/sdd.ts) (`constitutionSeed`), phase `sdd-constitution` in [`src/i18n/strings.ts`](../src/i18n/strings.ts) | adapted |
| **Clarify** (resolve ambiguity before spec) | Spec-Kit (`/speckit.clarify`) | [spec-kit README](https://github.com/github/spec-kit#readme) | phase `sdd-clarify` in [`src/i18n/strings.ts`](../src/i18n/strings.ts); routing in [`templates/core/routing.md.eta`](../templates/core/routing.md.eta) | adapted |
| **Delta changes on a living baseline + archive** | OpenSpec (`specs/` + `changes/` + `archive/`) | [OpenSpec README](https://github.com/Fission-AI/OpenSpec#readme) | `openspec/` layout in [`src/generate/sdd.ts`](../src/generate/sdd.ts); lifecycle in [`templates/sdd/orchestrator.md.eta`](../templates/sdd/orchestrator.md.eta) | adopted (layout convention) |

That's the whole list. If you find yourself adding a fourth row that pulls in *tooling* rather than a
*concept*, stop and re-read [ADR 0001](decisions/0001-mixed-sdd.md).

## What we deliberately did NOT replicate

- **Spec-Kit:** the `specify` CLI, `.specify/` directory, `/speckit.*` command names, `/speckit.analyze`,
  `/speckit.checklist`, templates/scripts/presets machinery.
- **OpenSpec:** the `openspec` CLI, `/opsx:*` command names, its validation engine and spec format.

Rationale: these are *machinery*. Adopting them would create double ceremony and external coupling, which
[ADR 0001](decisions/0001-mixed-sdd.md) exists to prevent.

## Re-sync checklist (what `/sdd-upstream-check` automates)

1. Read the **Last reviewed** dates above.
2. Fetch each upstream's releases/changelog since that date.
3. Keep only changes to **philosophy/workflow** (a new lifecycle stage, a renamed concept, a changed
   principle). Ignore CLI/tooling/packaging changes — they don't reach us.
4. For each relevant change, propose edits to our concept implementation (templates + `strings.ts` +
   `sdd.ts`) and to the table above.
5. Bump `TEMPLATES_VERSION` ([`src/version.ts`](../src/version.ts)) and update the **Last reviewed** dates.
6. Run `npm run build` + the smoke tests in [MAINTAINING](MAINTAINING.md); confirm idempotency holds.
