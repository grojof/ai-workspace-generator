# development/ — proceso de desarrollo (SDD + estado)

Proceso de desarrollo del proyecto: especificaciones vigentes, registro de cambios SDD y la foto viva
del estado. Markdown plano, versionado en git, legible por cualquier herramienta de IA. Aplica la
metodología (Spec-Kit + OpenSpec) sin depender de ningún CLI externo. Los **nombres de carpeta son
estables en inglés** (predecibles para tooling/IA); el **contenido** va en español.

Disposición:
- `specs/` — especificaciones estables (la verdad actual del comportamiento).
- `changes/<nombre>/` — un cambio en curso (`proposal.md` · `spec.md` · `design.md` · `tasks.md` · `verify-report.md`).
- `changes/archive/` — cambios completados.
- `status/` — foto viva del proyecto (`PROJECT-STATE.md`, `ARCHITECTURE.md`); se refresca con `/doc-sync`.

Regla: una carpeta por cambio lógico. Se archiva solo cuando `verify` pasa, fundiendo su delta en `specs/`.
