# Arquitectura

Cómo `ai-workspace` convierte un único fichero de configuración en un workspace de IA completo e
idempotente para cualquier repo.

## Modelo mental

Hay **una entrada** (`workspace.config.yaml`) y **muchas salidas** (AGENTS.md, CLAUDE.md, ficheros de
Copilot, configs MCP, scaffold SDD, docs vivas…). El CLI no inventa estado: cada artefacto es una
función pura de la config más la **librería de plantillas** en [`templates/`](../../templates/).
Re-ejecutar es seguro porque las escrituras son **idempotentes** y las ediciones del usuario se
preservan mediante **regiones gestionadas**.

```mermaid
flowchart LR
  CFG["workspace.config.yaml"] --> LOAD["loadConfig + validación zod"]
  LOAD --> COMPOSE[composeBlocks]
  TPL["templates/*.eta"] --> COMPOSE
  COMPOSE --> WRITE["writeManaged / writeFile / writeIfMissing"]
  WRITE --> OUT["AGENTS.md, CLAUDE.md, .github/*, .mcp.json, docs/development/*, docs/README.md, ..."]
```

## El pipeline, fichero a fichero

1. **Config** — [`src/config/schema.ts`](../../src/config/schema.ts) define `ConfigSchema` (zod). Es el
   contrato: el wizard, `doctor` y todos los generadores leen de él.
   [`src/config/loader.ts`](../../src/config/loader.ts) carga/valida (`loadConfig`) y escribe (`saveConfig`).
2. **Detección de stack** — [`src/detect/stack.ts`](../../src/detect/stack.ts) (`detectStack`) lee
   `package.json`, `tsconfig.json`, `go.mod`, etc. para precargar el wizard. Solo lectura.
3. **Componer** — [`src/generate/agents.ts`](../../src/generate/agents.ts) (`composeBlocks`) recorre el
   **manifest declarativo** [`BLOCK_MANIFEST`](../../src/generate/blockManifest.ts) — la lista ordenada de
   **bloques gestionados** de AGENTS.md y su gating — tomando fragmentos de capa de `templates/`.
4. **Renderizar** — [`src/render/engine.ts`](../../src/render/engine.ts) envuelve Eta. `templateExists`
   permite al compositor usar un bloque genérico cuando un módulo no tiene plantilla. `setLocale` elige
   la variante de idioma (ver i18n abajo).
5. **Escribir** — [`src/render/writer.ts`](../../src/render/writer.ts) escribe y reporta
   `created | updated | unchanged`. Tres estrategias (abajo).
6. **Orquestar** — [`src/generate/index.ts`](../../src/generate/index.ts) (`generate`) llama a cada
   sub-generador y devuelve la lista de `Artifact` para el informe.

## El modelo de capas

Las instrucciones se componen en seis capas, para que la base común no choque con las reglas de
empresa/negocio. Las capas mapean a carpetas de plantillas y a secciones de config:

| Capa | Carpeta de plantillas | Origen en config | Id de bloque en AGENTS.md |
|------|----------------------|------------------|----------------------------|
| 0 · Núcleo | [`templates/core/`](../../templates/core/) | siempre activo | `header`, `core` |
| 0 · Perfil | [`templates/profile/`](../../templates/profile/) | `profile` | `profile` |
| 1 · Lenguaje | [`templates/languages/<id>/`](../../templates/languages/) | `stack.languages` | `lang-<id>` |
| 2 · Framework | [`templates/frameworks/<id>/`](../../templates/frameworks/) | `stack.frameworks` | `fw-<id>` |
| 3 · Entornos | [`templates/environments/<id>/`](../../templates/environments/) | `stack.environments` | `env-<id>` |
| 4 · Empresa (overlay) | [`templates/company/<org>/`](../../templates/company/) | `company` (`example`, o tu propia org) | `company-overlay` |
| 4 · Empresa (convenciones) | [`templates/company/`](../../templates/company/) | `conventions` | `company` |
| 5 · Negocio | [`templates/business/`](../../templates/business/) | `business` | `business` |

Más bloques de funcionalidad: `sdd` (si `sdd.enabled`), `living-docs` (si `livingDocs`), e `imported`
(añadido por `ai-workspace import`).

El bloque `sdd` admite dos **metodologías** (`sdd.methodology`): `sdd` (spec-driven, por defecto) y `spdd`
(Structured-Prompt-Driven — el prompt REASONS Canvas como artefacto versionado). Son **ortogonales** a
`sdd.schema` (profundidad del spec): `spdd` **implica** `schema: reasons` (normalizado en un único
`.transform` de `ConfigSchema`). SPDD **reutiliza** la familia `/sdd-*` y las skills `reasons` — no es un
fork; solo cambia el framing del orquestador. Cuándo usar cada una, con ejemplo end-to-end:
[Metodologías: SDD vs SPDD](methodologies.md).

El bloque `profile` codifica la **postura de gobernanza** según el perfil de usuario (tipo × nivel) y
renderiza solo la combinación activa, para no inflar tokens. Ver [Extender](EXTENDING.md).

El **orden** de bloques está fijado en `BLOCK_MANIFEST`: `header → core → profile → versioning → safety →
workflow → harness-engineering → routing → skill-routing → lenguajes → frameworks → entornos →
company-overlay → company → business → sdd → living-docs`. El bloque `company-overlay` (cultura + 7 reglas
de la organización) solo aparece si `company` no es `none` (p. ej. `example`); es **inglés siempre** (lo consume la IA).

Los **principios Layer-0** (governance) son las entradas always-on del manifest: `core`, `versioning`,
`safety`, `workflow`, `harness-engineering`. `harness-engineering` codifica la postura *harness/context
engineering* (contexto finito, *progressive disclosure*, *just-in-time* vía context7, memoria en las
living docs) y el **ratchet principle**: una regla solo entra en `AGENTS.md` cuando previene un fallo real.
Añadir un principio nuevo es **una fila** más en el manifest (ver [EXTENDER](EXTENDING.md)).

El bloque `skill-routing` indica qué skills usar según el perfil activo; se deriva del registro de skills
en [`src/modules/skills.ts`](../../src/modules/skills.ts) **más** el frontmatter de los skill-packs aplicables,
filtrado por `profile`.

## Skills como datos (skill-packs)

Las skills ricas no se escriben en código: viven como **markdown** en [`skill-packs/<id>/`](../../skill-packs/)
(modelo *skills-as-data*). Cada pack es `SKILL.md`
(índice, *model-invoked*) + `references/*.md` (guías on-demand) + `pack.yaml` (gating/routing) + opcional
`overlay.<company>.md`. [`src/generate/stackPacks.ts`](../../src/generate/stackPacks.ts) los copia a
`.claude/skills/<id>/` cuando aplican:

- **Gating** — `stackBinding` (stack activo) y/o `gating` (feature/empresa) + `profile`.
- **Tokens** — los packs `templated` resuelven `{{paths.*}}` (de `docsPaths`) y `{{brand.*}}`
  (de [`brands.ts`](../../src/generate/brands.ts)) al copiar.
- **Base + overlay** — `overlay.<company>.md` se anexa como bloque gestionado (la base no se toca).
- **Routing** — cada pack aporta su fila a `skill-routing`, o la cede al catálogo con `routing: false`.

La base de un pack puede venir **vendorizada** de un upstream MIT (p. ej. `agent-skills`) en
[`vendor/`](../../vendor/) — mirror versionado para diffs limpios — y se actualiza con `ai-workspace skills sync`.
Todo el contenido de **fusión** (sdd-builder/audit/schema/onboarding/migrate, corp-*) y los **stacks**
(odoo-18.0) son packs; solo las skills **nativas** del tool (flujo lean SDD, living-docs, guías) se generan por código.

## Regiones gestionadas — el contrato de idempotencia

[`src/render/managed-region.ts`](../../src/render/managed-region.ts) envuelve el contenido generado en
marcadores para que `sync` solo reescriba lo que le pertenece:

- Ficheros Markdown/HTML: `<!-- ai-workspace:begin:<id> -->` … `<!-- ai-workspace:end:<id> -->`
- Ficheros hash (`.gitignore`, `.gitattributes`, `.claudeignore`): `# >>> ai-workspace:begin:<id>` …

`upsertBlock` reemplaza el contenido interno de un bloque existente, o lo añade si no existe. **El texto
fuera de los marcadores nunca se toca.** Esto permite que el usuario añada notas a AGENTS.md y se
conserven entre regeneraciones.

> ⚠️ Un `id` de bloque es un **contrato estable**. Ver
> [MANTENER](MAINTAINING.md#renombrar-o-eliminar-un-id-de-bloque) para entender por qué renombrarlo deja
> contenido huérfano en los repos de los usuarios.

## Estrategias de escritura

[`src/render/writer.ts`](../../src/render/writer.ts) expone tres, elegidas por artefacto:

| Función | Comportamiento | Se usa para |
|---------|----------------|-------------|
| `writeManaged` | upsert de bloques, preserva el resto | AGENTS.md, CLAUDE.md, copilot-instructions, ignore, .gitattributes |
| `writeFile` | sobrescritura completa (contenido determinista) | `.mcp.json`, `.vscode/mcp.json`, comandos, skills, onboarding |
| `writeIfMissing` | crea una vez, nunca sobrescribe (del usuario) | `.editorconfig`, seed de `settings.json`, scaffold del almacén SDD bajo `docs.development` (por defecto `docs/development/`; incl. `constitution.md` en proyectos nuevos), seeds `docs/development/status/*`, `docs/README.md`, copias importadas |

También hay un modo **dry-run** (`setDryRun` / `getPlanned`) que usa `upgrade --check` para calcular
cambios sin tocar el disco.

## Targets (adaptadores)

`AGENTS.md` es la fuente única de verdad; el resto son adaptadores generados en
[`src/generate/index.ts`](../../src/generate/index.ts):

```mermaid
flowchart TD
  AG["AGENTS.md bloques gestionados"] --> CL["CLAUDE.md (importa @AGENTS.md)"]
  AG --> CO[".github/copilot-instructions.md (espejo, mismos bloques sin header)"]
  CFG["config.mcp"] --> M1[".mcp.json"]
  CFG --> M2[".vscode/mcp.json"]
```

Claude importa AGENTS.md con `@AGENTS.md`, así que su adaptador es fino. Copilot no puede importar, así
que el CLI vuelca los mismos bloques en `copilot-instructions.md`. Por eso esto es un CLI y no una
copia única de plantilla: mantiene el espejo sincronizado de forma determinista.

## Internacionalización (i18n)

`config.language` (`es` por defecto) controla el idioma del contenido generado:

- **Plantillas**: `renderTemplate` busca primero `templates/i18n/<locale>/<ruta>` y cae a la base (en).
  Las traducciones viven en [`templates/i18n/es/`](../../templates/i18n/es/).
- **Textos cortos** embebidos en código (descripciones, cabeceras): [`src/i18n/strings.ts`](../../src/i18n/strings.ts).
- **Prosa media** (comandos/skills SDD, docs vivas): localizada en sus generadores según `config.language`.

Para añadir un idioma: crea `templates/i18n/<locale>/` con las plantillas a traducir y añade su entrada
en `strings.ts`. La base en inglés siempre actúa como fallback.

## Registro de módulos

[`src/modules/registry.ts`](../../src/modules/registry.ts) es el catálogo de lenguajes/frameworks/MCPs
conocidos. `init`, `add` y `doctor` leen de él. `bundled: true` indica que existe una plantilla
dedicada; si no, el compositor emite un bloque genérico que apunta a context7. Ver [EXTENDER](EXTENDING.md).

## Comandos

| Comando | Fuente | Qué hace |
|---------|--------|----------|
| `init` | [`commands/init.ts`](../../src/commands/init.ts) | wizard → escribe config → `generate` |
| `sync` | [`commands/sync.ts`](../../src/commands/sync.ts) | `generate` desde la config existente |
| `add` | [`commands/add.ts`](../../src/commands/add.ts) | muta la config, re-`generate` |
| `import` | [`commands/import.ts`](../../src/commands/import.ts) | ingiere activos, escribe bloque `imported` + checklist |
| `upgrade` | [`commands/upgrade.ts`](../../src/commands/upgrade.ts) | diff en dry-run, aplica, sube `templatesVersion` |
| `doctor` | [`commands/doctor.ts`](../../src/commands/doctor.ts) | lint: presupuesto de tokens, artefactos clave |
| `package` | [`commands/package.ts`](../../src/commands/package.ts) | empaqueta plugin + marketplace + zips de skill ([DISTRIBUCIÓN](DISTRIBUTION.md)) |
| `skills sync` | [`commands/skillsSync.ts`](../../src/commands/skillsSync.ts) | actualiza packs vendorizados desde el upstream (diff + apply) |

El cableado del CLI (commander) está en [`src/cli.ts`](../../src/cli.ts).

## Por qué la reconciliación con context7 vive en la IA, no en el CLI

El CLI no puede llamar a servidores MCP — context7 es un MCP disponible para el *agente*. Por eso
`import` hace el trabajo determinista (escanear, clasificar, copiar, escribir un bloque `imported`) y
emite `docs/development/status/INGEST-RECONCILE.md`, una checklist que la IA ejecuta con context7. Tenlo en cuenta al
extender: todo lo que necesite docs de librerías en vivo va en un prompt/skill generado, no en el CLI.
