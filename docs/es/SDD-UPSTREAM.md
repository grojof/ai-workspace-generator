# Procedencia del SDD upstream

Esta es la **fuente única de verdad de mantenimiento** para nuestra metodología SDD mixta. Tomamos
*conceptos* (no código) de dos proyectos upstream — ver [ADR 0001](../decisions/0001-mixed-sdd.md).
Cuando alguno evoluciona su filosofía, este fichero es lo que reconciliamos. Mantenlo pequeño:
conceptos, no un fork.

> 🤖 Para refrescar este fichero, ejecuta el comando **`/sdd-upstream-check`** (en `.claude/commands/`
> de este repo). El agente consulta el changelog de cada upstream desde la fecha *revisado* de abajo,
> marca solo los cambios relevantes para la filosofía, propone ediciones en los templates y sube
> `TEMPLATES_VERSION`.

## Upstreams seguidos

| Proyecto | Repo | Releases | Última revisión |
|----------|------|----------|-----------------|
| Spec-Kit | https://github.com/github/spec-kit | https://github.com/github/spec-kit/releases | 2026-06-15 (`main`) |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | https://github.com/Fission-AI/OpenSpec/releases | 2026-06-15 (`main`) |

## Qué tomamos prestado (toda la superficie replicada)

| Concepto | De | Anchor upstream | Nuestra implementación | Estado |
|----------|-----|-----------------|------------------------|--------|
| **Constitución** (principios del proyecto) | Spec-Kit (`/speckit.constitution`, `.specify/memory/`) | [README spec-kit](https://github.com/github/spec-kit#readme) | seed `openspec/constitution.md` en [`src/generate/sdd.ts`](../../src/generate/sdd.ts) (`constitutionSeed`), fase `sdd-constitution` en [`src/i18n/strings.ts`](../../src/i18n/strings.ts) | adaptado |
| **Clarify** (resolver ambigüedad antes de la spec) | Spec-Kit (`/speckit.clarify`) | [README spec-kit](https://github.com/github/spec-kit#readme) | fase `sdd-clarify` en [`src/i18n/strings.ts`](../../src/i18n/strings.ts); enrutado en [`templates/core/routing.md.eta`](../../templates/core/routing.md.eta) | adaptado |
| **Cambios delta sobre baseline viva + archivar** | OpenSpec (`specs/` + `changes/` + `archive/`) | [README OpenSpec](https://github.com/Fission-AI/OpenSpec#readme) | disposición `openspec/` en [`src/generate/sdd.ts`](../../src/generate/sdd.ts); ciclo de vida en [`templates/sdd/orchestrator.md.eta`](../../templates/sdd/orchestrator.md.eta) | adoptado (convención de carpetas) |

Esta es la lista completa. Si te ves añadiendo una cuarta fila que arrastra *maquinaria* en lugar de un
*concepto*, para y relee el [ADR 0001](../decisions/0001-mixed-sdd.md).

## Qué NO replicamos deliberadamente

- **Spec-Kit:** el CLI `specify`, el directorio `.specify/`, los nombres `/speckit.*`, `/speckit.analyze`,
  `/speckit.checklist`, su maquinaria de templates/scripts/presets.
- **OpenSpec:** el CLI `openspec`, los nombres `/opsx:*`, su motor de validación y su formato de spec.

Motivo: es *maquinaria*. Adoptarla crearía doble ceremonia y acoplamiento externo, justo lo que el
[ADR 0001](../decisions/0001-mixed-sdd.md) existe para evitar.

## Checklist de re-sincronización (lo que automatiza `/sdd-upstream-check`)

1. Lee las fechas de **Última revisión** de arriba.
2. Consulta releases/changelog de cada upstream desde esa fecha.
3. Quédate solo con cambios de **filosofía/flujo** (una etapa nueva del ciclo, un concepto renombrado,
   un principio cambiado). Ignora cambios de CLI/tooling/empaquetado — no nos llegan.
4. Por cada cambio relevante, propón ediciones a nuestra implementación de conceptos (templates +
   `strings.ts` + `sdd.ts`) y a la tabla de arriba.
5. Sube `TEMPLATES_VERSION` ([`src/version.ts`](../../src/version.ts)) y actualiza las fechas de
   **Última revisión**.
6. Ejecuta `npm run build` + los smoke tests de [MAINTAINING](MAINTAINING.md); confirma que se mantiene
   la idempotencia.
