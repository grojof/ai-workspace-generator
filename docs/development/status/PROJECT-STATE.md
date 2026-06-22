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

- **Targets** — `claude` · `copilot` · `codex` (cambio 0006). `AGENTS.md` es fuente única **y** adaptador
  nativo de Codex (`codex` añade `.codex/config.toml` MCP en TOML); `copilot` funciona en VS Code **y**
  Visual Studio. `.vscode/` es opcional vía flag `vscode` (default true).
- **Perfiles** — `business`/`technical` × `beginner`/`standard`/`advanced` (`ProfileSchema`); bloque
  `profile` compacto en `AGENTS.md` (solo combinación activa).
- **Catálogo de skills** — registro con metadatos (`src/modules/skills.ts`) + bloque `skill-routing`
  filtrado por el perfil activo.
- **Capas + composición declarativa** — orden y gating de bloques en `BLOCK_MANIFEST` (datos): añadir un
  bloque/principio = una fila. Contratos de extensión *enforced* en `test/invariants.test.js` (ADR 0002).
  Los ids de la espina de gobernanza llevan el namespace reservado `aiws:` (`header` → `aiws:header`),
  aplicado en `composeFromManifest`; skills/commands generados llevan `aiws-*` con procedencia
  (`source: aiws@<TEMPLATES_VERSION>`) (ADR 0003 F1).
- **Multi-repo (generación por repo)** — `repos[]` (additive) + `resolveRepos`/`unionStack`; `generate()`
  separa **workspace-level** (root: `AGENTS.md` + CLAUDE.md puente + Copilot + MCP/settings + skills de
  workflow + packs no-stack, sobre la unión de stacks) de **repo-level** (cada hijo: `CLAUDE.md` que importa
  `@../AGENTS.md` + packs de su stack). `repos[]` vacío ⇒ idéntico a single-repo (cambio 0003). Cada hijo
  recibe además una instrucción Copilot path-scoped (`applyTo`) en el root (cambio 0005).
- **SDD** — una metodología con modos `lean`/`reasons`; skills `sdd-*` (schema, onboarding, audits,
  builder, migrate, spec-sync) on-demand. Eje `sdd.methodology: sdd | spdd` (`spdd ⇒ reasons`).
- **Skill-packs de stack** — base vendorizada (MIT/Apache, `vendor/`) + `pack.yaml` con routing/gating;
  `ai-workspace skills sync` actualiza la base preservando overlays.
- **Empaquetado** — `ai-workspace package` → plugin paraguas + marketplace privado + zips de skill. En
  multi-repo **agrega** skills/commands/agents del root + cada hijo (dedup primero-gana) en el mismo plugin
  paraguas (cambio 0004); `distribution.perRepo: true` emite un plugin por repo (cambio 0005).
- **Hooks de gobernanza** — safety guard opt-in (`workflow.hooks.safetyGuard`).
- **Company overlay (opcional)** — placeholder `templates/company/example/`; ningún dato de empresa real.

## Decisiones vigentes

- **Idioma:** artefactos que consume la IA en **inglés siempre**; `config.language` rige el contenido humano.
- **Commits:** Conventional Commits, identidad del usuario, **sin** `Co-Authored-By`.
- **CI:** workflows/Dependabot **activos** (`.github/workflows/ci.yml` + `.github/dependabot.yml`): CI corre
  `typecheck` + `test` en Node 20/22 en cada push a `main` y en PRs; Dependabot semanal (actions + dev deps).
- **Material de origen:** el **texto** de `vendor/` (mirror upstream) se versiona; los binarios están gitignorados.
- **Extensión a empresa:** fuera de este repo público; se trae como overlays propios (ver [EXTENDING](../../project/EXTENDING.md)).
- **Foundations (ADR 0003):** una sola tenencia (personal/freelance = org `corp-<handle>`); namespace reservado
  `aiws-*` (skills/commands) / `aiws:*` (block ids) con procedencia. Principio: `aiws-` solo marca lo que
  **nosotros** autoramos — los packs **vendored** (`base:`) y los **stack packs** conservan su nombre de
  ecosistema. Migración de namespace **automatizada** en `ai-workspace upgrade` (`src/commands/migrate.ts`,
  idempotente, `--check`). Los packs de empresa declaran su `relation` (new / extends / overrides:`<aiws-id>`)
  en `pack.yaml` — primitiva auditable para `aiws-reconcile`. Hechos: F1 (namespace + migración), F2a (packs
  `sdd-*` autorados → `aiws-sdd-*` + invariante), F2b (`relation`). TEMPLATES_VERSION 0.38.0. Pendientes: **F2c**
  (packs git de empresa + `company` → objeto + guard runtime; requiere spec/design propio — Safety gate),
  F3 (manifiesto de integridad + `aiws-verify`), F4 (`aiws-reconcile`).
