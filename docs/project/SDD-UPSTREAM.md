# SDD upstream provenance

This is the **single source of maintenance truth** for our mixed SDD methodology. We take *concepts* (not
code) from two upstream projects — see [ADR 0001](decisions/0001-mixed-sdd.md). When either evolves its
philosophy, this file is what we reconcile. Keep it small: concepts, not a fork.

> 🤖 To refresh this file, run the **`/sdd-upstream-check`** command (in this repo's `.claude/commands/`). The
> agent checks each upstream's changelog since the *reviewed* date below, flags only the philosophy-relevant
> changes, proposes edits to the templates, and bumps `TEMPLATES_VERSION`.

## Upstreams tracked

| Project | Repo | Releases | Last reviewed |
|---------|------|----------|---------------|
| Spec-Kit | https://github.com/github/spec-kit | https://github.com/github/spec-kit/releases | 2026-06-15 (`main`) |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | https://github.com/Fission-AI/OpenSpec/releases | 2026-06-15 (`main`) |

## What we borrow (the whole replicated surface)

| Concept | From | Upstream anchor | Our implementation | Status |
|---------|------|-----------------|--------------------|--------|
| **Constitution** (project principles) | Spec-Kit (`/speckit.constitution`, `.specify/memory/`) | [spec-kit README](https://github.com/github/spec-kit#readme) | seed `openspec/constitution.md` in [`src/generate/sdd.ts`](../../src/generate/sdd.ts) (`constitutionSeed`), `sdd-constitution` phase in [`src/i18n/strings.ts`](../../src/i18n/strings.ts) | adapted |
| **Clarify** (resolve ambiguity before the spec) | Spec-Kit (`/speckit.clarify`) | [spec-kit README](https://github.com/github/spec-kit#readme) | `sdd-clarify` phase in [`src/i18n/strings.ts`](../../src/i18n/strings.ts); routed in [`templates/core/routing.md.eta`](../../templates/core/routing.md.eta) | adapted |
| **Delta changes over a living baseline + archive** | OpenSpec (`specs/` + `changes/` + `archive/`) | [OpenSpec README](https://github.com/Fission-AI/OpenSpec#readme) | `openspec/` layout in [`src/generate/sdd.ts`](../../src/generate/sdd.ts); lifecycle in [`templates/sdd/orchestrator.md.eta`](../../templates/sdd/orchestrator.md.eta) | adopted (folder convention) |

This is the complete list. If you find yourself adding a fourth row that drags in *machinery* instead of a
*concept*, stop and re-read [ADR 0001](decisions/0001-mixed-sdd.md).

## What we deliberately do NOT replicate

- **Spec-Kit:** the `specify` CLI, the `.specify/` directory, the `/speckit.*` names, `/speckit.analyze`,
  `/speckit.checklist`, its template/script/preset machinery.
- **OpenSpec:** the `openspec` CLI, the `/opsx:*` names, its validation engine and its spec format.

Reason: it's *machinery*. Adopting it would create double ceremony and external coupling — exactly what
[ADR 0001](decisions/0001-mixed-sdd.md) exists to avoid.

## Re-sync checklist (what `/sdd-upstream-check` automates)

1. Read the **Last reviewed** dates above.
2. Check each upstream's releases/changelog since that date.
3. Keep only **philosophy/flow** changes (a new lifecycle stage, a renamed concept, a changed principle).
   Ignore CLI/tooling/packaging changes — they don't reach us.
4. For each relevant change, propose edits to our concept implementation (templates + `strings.ts` +
   `sdd.ts`) and to the table above.
5. Bump `TEMPLATES_VERSION` ([`src/version.ts`](../../src/version.ts)) and update the **Last reviewed** dates.
6. Run `npm run build` + the [MAINTAINING](MAINTAINING.md) smoke tests; confirm idempotency holds.
