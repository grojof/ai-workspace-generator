# Estado del proyecto (living doc)

> Foto siempre actualizada del repo para que la IA (y el equipo) tengan contexto sin re-escanear todo.
> Refréscala tras cualquier cambio que mueva el estado (skill `living-docs` / `/doc-sync`).

## Qué es

Generador CLI (Node/TypeScript) que produce workspaces de IA (Claude Code + Copilot) desde una sola
config (`workspace.config.yaml`) y una librería de plantillas por capas. `AGENTS.md` es la fuente única
de verdad; los adaptadores son proyecciones idempotentes. Arquitectura: [docs/project/ARCHITECTURE.md](../../project/ARCHITECTURE.md).

## Orientación

Repo **público y personal**, enfocado a **herramientas shared** para developers individuales (aprender,
preparar entrevistas, formarse y programar con utilidades). Mantiene la capacidad de aplicar a una
**empresa** como **punto de extensión opcional** (`company`, `templates/company/`), con placeholders y
mantenimiento mínimo. **Sin datos de negocio reales.**

## Capacidades actuales

- **Perfiles** — `business`/`technical` × `beginner`/`standard`/`advanced` (`ProfileSchema`); bloque
  `profile` compacto en `AGENTS.md` (solo combinación activa).
- **Catálogo de skills** — registro con metadatos (`src/modules/skills.ts`) + bloque `skill-routing`
  filtrado por el perfil activo.
- **Capas + composición declarativa** — orden y gating de bloques en `BLOCK_MANIFEST` (datos): añadir un
  bloque/principio = una fila. Contratos de extensión *enforced* en `test/invariants.test.js` (ADR 0002).
- **SDD** — una metodología con modos `lean`/`reasons`; skills `sdd-*` (schema, onboarding, audits,
  builder, migrate, spec-sync) on-demand. Eje `sdd.methodology: sdd | spdd` (`spdd ⇒ reasons`).
- **Skill-packs de stack** — base vendorizada (MIT/Apache, `vendor/`) + `pack.yaml` con routing/gating;
  `ai-workspace skills sync` actualiza la base preservando overlays.
- **Empaquetado** — `ai-workspace package` → plugin paraguas + marketplace privado + zips de skill.
- **Hooks de gobernanza** — safety guard opt-in (`workflow.hooks.safetyGuard`).
- **Company overlay (opcional)** — placeholder `templates/company/example/`; ningún dato de empresa real.

## Decisiones vigentes

- **Idioma:** artefactos que consume la IA en **inglés siempre**; `config.language` rige el contenido humano.
- **Commits:** Conventional Commits, identidad del usuario, **sin** `Co-Authored-By`.
- **CI:** workflows/Dependabot **desactivados temporalmente** (`.disabled`) durante la estabilización pública.
- **Material de origen:** el **texto** de `vendor/` (mirror upstream) se versiona; los binarios están gitignorados.
- **Extensión a empresa:** fuera de este repo público; se trae como overlays propios (ver [EXTENDING](../../project/EXTENDING.md)).
