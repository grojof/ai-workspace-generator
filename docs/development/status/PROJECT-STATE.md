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
- **SDD** — una metodología con modos `lean`/`reasons`; skills `aiws-sdd-*` (schema, onboarding, audits,
  builder, migrate, spec-sync) on-demand. Eje `sdd.methodology: sdd | spdd` (`spdd ⇒ reasons`). Las skills de
  fase son **ricas** (0012a/b): descripción intencional + plantilla de salida + quality bar; el comando es un
  lanzador fino que apunta a la skill; el `spec.md` usa el **formato delta de OpenSpec** (ADDED/MODIFIED/REMOVED
  + RFC 2119 + GIVEN/WHEN/THEN + `[NEEDS CLARIFICATION]` + Success Criteria).
- **Skill-packs de stack** — base vendorizada (MIT/Apache, `vendor/`) + `pack.yaml` con routing/gating;
  `ai-workspace skills sync` actualiza la base preservando overlays.
- **Empaquetado** — `ai-workspace package` → plugin paraguas + marketplace privado + zips de skill. En
  multi-repo **agrega** skills/commands/agents del root + cada hijo (dedup primero-gana) en el mismo plugin
  paraguas (cambio 0004); `distribution.perRepo: true` emite un plugin por repo (cambio 0005).
- **Hooks de gobernanza** — safety guard opt-in (`workflow.hooks.safetyGuard`).
- **Company overlay (opcional)** — placeholder `templates/company/example/`; ningún dato de empresa real.
- **Coherencia de docs (0016a)** — `docs.contract` (config, con default; README raíz = índice `authored`) +
  checks en `doctor` (refs colgantes + huérfanos, `warn`, `docCoherence.ts` puro y testeado); `doc-sync` cubre
  `docs/project/`. El store SDD queda fuera de alcance.
- **Autoauditoría (0016b)** — skill `aiws-audit` + `/aiws-audit`: informe **read-only** fechado en
  `docs/development/audits/` que compone `doctor`/`verify`/`reconcile` + el contrato. Bucle autoalimentado.
- **Progressive disclosure (0017)** — AGENTS.md = hub Layer-0 inline + **punteros**; detalle de tarea delegado
  a las skills cross-tool.
- **Baseline de ingeniería (0018)** — la matriz de prosa por-stack se eliminó: la profundidad de oficio vive en
  **un** `references/engineering-practices.md` agnóstico de lenguaje (puntero hub `aiws:engineering-practices`),
  y cada stack queda como una **línea context7 inline** en AGENTS.md (sin fichero de cuerpo ni proyección
  Copilot). Lo específico de stack/dominio → **skill packs** (camino diseñado).

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
  en `pack.yaml` — primitiva auditable para `aiws-reconcile`. Integridad **verificable** (no candado): `generate` escribe `.ai-workspace/manifest.json` (hash de regiones
  `aiws:*` en ficheros managed — la prosa del usuario fuera de marcadores es libre; fichero completo en skills/
  commands `aiws-*`); `ai-workspace verify` / `doctor --strict` recomputan y salen con error ante manipulación
  (CI gate). Parte E **completa** = detectar (`verify`) + auto-sanar (`sync --check` previsualiza el diff antes de
  sobrescribir) + confinar (el hook `safetyGuard` también vigila Write/Edit a ficheros base propios del
  manifiesto; AGENTS.md no se vigila). Los packs git de empresa (`company.packs: [git+url#ref]`) se vendorizan con `ai-workspace packs sync`
  (pinneados, commiteados en `.ai-workspace/packs/`); `ai-workspace reconcile` clasifica los overlays de
  empresa vs base (🔵 único / 🟢 redundante / 🟡 conflicto / ⚠️ drift) y la skill `aiws-reconcile` lo convierte
  en propose-and-review. **ADR 0003 COMPLETO (A–F):** A tenencia · B namespace+procedencia · C `relation` ·
  D extender/actualizar (packs git) · E integridad (manifiesto+`verify`+auto-sanación+confinamiento) ·
  F reconciliación. **Aplicado al propio repo (dogfood) y publicado en `v0.2.0`.**
- **Calidad post-v0.2.0 (auditoría jun-2026):** PR #51 (audit-remediation) añadió **ESLint + Prettier + `.nvmrc`**
  (exigidos en CI), `any→unknown` en el borde de detección, eliminó el self-plugin redundante y revivió el
  `CHANGELOG`. PR #52 (**0016a**) añadió el **contrato de docs** (`docs.contract`, default; el README raíz es el
  índice `authored`) y checks de coherencia en `doctor` (refs colgantes + huérfanos, `warn`, `docCoherence.ts`),
  con `doc-sync` cubriendo `docs/project/`. **0016b** (PR #54) añadió la skill **`aiws-audit`** + `/aiws-audit`:
  autoauditoría **read-only** fechada en `docs/development/audits/` (compone `doctor`/`verify`/`reconcile` + el
  contrato) — el repo se autoalimenta. **0016 entregado** (a + backlog + b).
- **Progressive disclosure de AGENTS.md (0017, antes 0016c):** investigación del ecosistema (PRs #56–#58,
  `0017/research.md`) confirmó que **Agent Skills es ya estándar abierto cross-tool** (Claude/Codex/Copilot/
  opencode) y la convergencia en 3 niveles (always inline · path `applyTo`/globs · task skill-`description`).
  **0017a** (PR #56): reglas de stack → `references/stack/<id>.md` + **punteros** en AGENTS.md (ids estables) +
  proyección Copilot `applyTo`; de-hardcodeado el `typescript.instructions.md`. **0017b** (PR #58): podado el
  detalle REASONS duplicado del orquestador SDD → puntero a las skills cross-tool (REASONS −~170 tok). Layer-0
  de gobernanza **siempre inline**; los punteros los vigila el check de refs de 0016a; skills validadas contra
  el Agent Skills spec (`skill-spec.test.js`). TEMPLATES_VERSION **0.52.0**; AGENTS.md 5678/6000.
- **Baseline de ingeniería, poda de la prosa por-stack (0018):** se reemplazó la matriz de 12 `layer.md.eta`
  por **un** `references/engineering-practices.md` rico y agnóstico de lenguaje ("reglas con dientes": disciplina
  de cambios, datos/migraciones, secretos/supply-chain, límites, errores, testing, observabilidad, rendimiento),
  alcanzado por un puntero hub lean (`aiws:engineering-practices`, tras `harness-engineering`). Los bloques
  `lang-*/fw-*/env-*` **conservan sus ids** pero su contenido es ahora una **línea context7 inline**; se eliminó
  `stackBody`/`generateStackReferences`/los mapas de glob y la proyección Copilot `*.instructions.md` por-stack.
  Lo específico de stack/dominio es trabajo del usuario **por diseño** → **skill packs / grupos** (estilo Odoo).
  Migración **no destructiva**: `sync` no borra los `references/stack/*.md` ni `*.instructions.md` previos (ver
  [MAINTAINING](../../project/MAINTAINING.md)). El **wizard** (simplificación) y el **install headless** quedan
  como follow-ups (0019). TEMPLATES_VERSION **0.53.0**; AGENTS.md ~5828/6000. **Aplicado al propio repo (dogfood).**
