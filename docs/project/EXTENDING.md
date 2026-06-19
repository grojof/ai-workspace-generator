# Extender

Recetas para añadir capacidades. Cada una termina con las **implicaciones**: qué cambia para los
usuarios que ya generaron un workspace.

> Regla de oro: un cambio en una plantilla `.eta` o en `composeBlocks` afecta al próximo `sync` de
> **todos**. Sube `TEMPLATES_VERSION` (ver [MANTENER](MAINTAINING.md)) y prefiere cambios aditivos.
>
> Los **contratos estables** (orden e ids de bloque, idempotencia, supervivencia del texto fuera de los
> marcadores, byte-equivalencia de binarios) están *enforced* por
> [`test/invariants.test.js`](../../test/invariants.test.js) y documentados en el
> [ADR 0002](decisions/0002-extension-contracts.md). Si cambias el orden/ids de bloque a propósito,
> actualiza el golden en el mismo commit; si un test invariante se pone rojo sin querer, es un bug.

---

## Añadir un módulo de lenguaje (p. ej. Go)

Un lenguaje funciona **sin** plantilla (se emite un bloque genérico). Añadir plantilla solo enriquece la
guía.

1. **Regístralo** en [`src/modules/registry.ts`](../../src/modules/registry.ts):
   ```ts
   export const LANGUAGES: ModuleEntry[] = [
     // …
     { id: "go", label: "Go", bundled: true },
   ];
   ```
2. **Escribe el fragmento** en `templates/languages/go/layer.md.eta` (y su traducción en
   `templates/i18n/es/languages/go/layer.md.eta`). Recibe la config y la entrada como `it.entry`:
   ```eta
   ## Go (Capa 1 — lenguaje) · objetivo v<%= it.entry.version %>

   - Formatea con `gofmt`/`goimports`; revisa con `go vet`. CI falla ante diffs.
   - Los errores son valores: envuélvelos con `%w`, nunca los ignores.

   > Consulta **context7** para `go@<%= it.entry.version %>`.
   ```
3. **Listo.** `composeBlocks` autodescubre la plantilla vía `templateExists`; no hay que tocar código.

**Probar:** `ai-workspace add language go` en un repo de pruebas y revisa el bloque `lang-go` de AGENTS.md.

**Implicaciones:** los usuarios existentes solo lo reciben al añadir Go (`add language go`) y ejecutar
`sync`. Si editaste una plantilla *existente*, lo reciben en su próximo `sync`/`upgrade` (sus notas
manuales fuera del bloque sobreviven).

---

## Añadir un módulo de framework (p. ej. Next.js)

Idéntico a un lenguaje, en `templates/frameworks/<id>/layer.md.eta`, registrado en `FRAMEWORKS`. El id
de bloque es `fw-<id>` y el fallback (sin plantilla) lo maneja `renderFramework` en
[`agents.ts`](../../src/generate/agents.ts).

**Implicaciones:** igual que los lenguajes. Añadir la plantilla nunca rompe repos que no usan el framework.

---

## Añadir un módulo de entorno (p. ej. WSL, Docker, una base de datos)

Los entornos son la Capa 3 — una dimensión paralela a lenguajes/frameworks (id de bloque `env-<id>`), para
convenciones de herramientas/runtime (SO, gestores de versiones, contenedores, bases de datos). Mismo mecanismo:

1. Regístralo en `ENVIRONMENTS` en [`src/modules/registry.ts`](../../src/modules/registry.ts).
2. Opcionalmente añade `templates/environments/<id>/layer.md.eta` (+ `templates/i18n/es/...`). Sin
   plantilla, se emite un bloque genérico que apunta a context7.
3. Opcionalmente añade detección en [`src/detect/stack.ts`](../../src/detect/stack.ts) (p. ej. `Dockerfile` → docker).

Mantén estos bloques **breves** — convenciones de setup y gotchas, con el detalle por versión delegado a context7.

## Añadir un bloque de AGENTS.md (principio / feature)

El orden y el gating de los bloques viven como **datos** en `BLOCK_MANIFEST`
([`src/generate/blockManifest.ts`](../../src/generate/blockManifest.ts)); `composeBlocks` solo lo recorre
(compositor declarativo dirigido por manifest). Añadir un bloque de nivel
superior es **una entrada** en el array, no cirugía en el compositor:

```ts
// bloque de plantilla, opcionalmente con gating:
{ kind: "template", id: "mi-bloque", template: "core/mi-bloque.md.eta", when: (c) => c.algunFlag },
// o contenido de una función de render:
{ kind: "render", id: "mi-bloque", render: (c) => renderMiBloque(c) },
```

- La **posición** en el array es el orden de salida (contrato estable — el golden de
  [`test/invariants.test.js`](../../test/invariants.test.js) lo fija; si lo cambias a propósito, actualiza
  el golden en el mismo commit).
- Un `id` nuevo es **aditivo**; sube `TEMPLATES_VERSION`. Renombrar/eliminar un `id` deja huérfanos
  ([MANTENER](MAINTAINING.md#renombrar-o-eliminar-un-id-de-bloque)).
- `kind: "expand"` es para bloques que se derivan de un array de config (las capas de stack `lang/fw/env`).

## Modo aprendizaje (purpose: learn)

`project.purpose: "learn"` convierte el workspace en un entorno de tutoría: añade un bloque `learning` a
AGENTS.md y una skill tutor `learn` + comando `/learn` ([`src/generate/learning.ts`](../../src/generate/learning.ts)).
Para ampliar el comportamiento docente, edita ese generador y `templates/core/learning.md.eta` (+ es).

## Añadir un servidor MCP

1. Añádelo al `REGISTRY` en [`src/generate/mcp.ts`](../../src/generate/mcp.ts):
   ```ts
   const REGISTRY = {
     context7: { /* … */ },
     myserver: { command: "npx", args: ["-y", "@scope/my-mcp"], note: "…" },
   };
   ```
2. Añádelo a `MCPS` en [`src/modules/registry.ts`](../../src/modules/registry.ts) para que `add mcp myserver` valide.
3. Tanto `.mcp.json` (Claude) como `.vscode/mcp.json` (Copilot) se emiten desde el mismo registro.

**Implicaciones:** los usuarios optan con `add mcp <id>`; los secretos van por env, nunca en plantillas.

---

## Añadir un stack pack (skills-as-data, al estilo `odoo-18.0`)

La forma **recomendada** de añadir skills ricas (stacks, contenido de empresa) es como **pack markdown** en
`skill-packs/<id>/` — *datos*, no código (modelo skills-as-data).
El generador ([`src/generate/stackPacks.ts`](../../src/generate/stackPacks.ts)) los copia a `.claude/skills/<id>/`
cuando aplican.

Estructura de un pack:
- `skill-packs/<id>/SKILL.md` — índice + frontmatter (la skill, *model-invoked*).
- `skill-packs/<id>/references/*.md` — guías on-demand (recomendado para stacks; disclosure progresivo).
- `skill-packs/<id>/pack.yaml` — **metadatos de gating/routing** (no se copia al workspace).
- `skill-packs/<id>/overlay.md` — overlay **genérico** opcional, **siempre** anexado al `SKILL.md` como bloque
  gestionado (p. ej. para enlazar las **convenciones del proyecto** desde `conventions.prefixes`).
- `skill-packs/<id>/overlay.<company>.md` — overlay de empresa opcional (se anexa como bloque gestionado).
- `skill-packs/<id>/agents/<name>.md` — **subagentes acompañantes** que se shippean a `.claude/agents/`
  (solo si el pack los declara en `pack.yaml` con `agents:`); el `package` también los incluye en el plugin.

`pack.yaml`:
```yaml
id: react-19
base: vendor/<repo>/...      # si viene de un origen vendorizado (para `skills sync`)
agents:                      # subagentes acompañantes → .claude/agents/; sync los refresca desde <dir>/SKILL.md
  - vendor/<repo>/agents/<name>
stackBinding:                 # se copia cuando el stack está activo en la config
  frameworks: [react]         # o languages / environments
profile:
  userType: [technical]
loadMode: on-demand
templated: false              # true → resuelve {{paths.*}} y {{brand.*}} al copiar
routing: true                 # false → el routing lo lleva el catálogo (src/modules/skills.ts)
```

- **Gating de feature/empresa** (sin stack): usa `gating:` (`gating.sdd.schema: reasons`, `gating.company: any|[example]`).
- **Vendorizar desde un origen permisivo** (MIT/Apache-2.0/BSD/CC-BY — p. ej. `agent-skills`, `anthropics/skills`):
  coloca la base en `vendor/<repo>/…`, apunta `base:` y mantenla con `ai-workspace skills sync` (ver
  [MANTENER](MAINTAINING.md)). Verifica la licencia **por-skill**; rechaza copyleft/share-alike y *source-available*.
- **Routing**: por defecto el pack aporta su fila a `skill-routing` (derivada del `pack.yaml`); pon `routing: false`
  si su routing vive en el catálogo.

**Probar:** un workspace con el stack activo (p. ej. `stack.frameworks: [react]`, perfil técnico) hereda el pack
completo en `.claude/skills/react-19/` (con sus `references/`).

## Añadir una skill nativa del tool

Las skills *propias* del generador (flujo lean SDD, `living-docs`, guía de aprendizaje, `vscode-setup`) siguen
produciéndose por código: [`src/generate/skills.ts`](../../src/generate/skills.ts) (SDD/living-docs) y
[`src/generate/guides.ts`](../../src/generate/guides.ts). Para una skill puntual, escribe con el helper
`frontmatter`. Las skills se emiten **solo si `targets` incluye `claude`**; el equivalente Copilot son prompts
en `.github/prompts/`. (Todo el contenido **de fusión** — sdd-builder/audit/schema/onboarding/migrate, corp-* —
vive ya como packs markdown, no en código.)

**Implicaciones:** packs y skills nativas se escriben con `writeFile` (sobrescritura) → los cambios llegan en
`sync`. Si renombras un pack/skill, la carpeta antigua **no** se borra de los repos — ver la nota de huérfanos
en [MANTENER](MAINTAINING.md#renombrar-o-eliminar-un-id-de-bloque).

---

## Añadir un idioma

1. Añade el valor al enum `language` en [`src/config/schema.ts`](../../src/config/schema.ts).
2. Añade su entrada en [`src/i18n/strings.ts`](../../src/i18n/strings.ts) (textos cortos + fases SDD).
3. Crea `templates/i18n/<locale>/` con las plantillas a traducir (la base en inglés es el fallback).
4. Localiza la prosa media en `sdd.ts`, `skills.ts`, `livingDocs.ts`, `guides.ts` según el locale.
5. Añade la opción al wizard en [`src/commands/init.ts`](../../src/commands/init.ts).

---

## Añadir un nuevo target (p. ej. Cursor)

Cambio mayor. Puntos a tocar:

1. El enum `targets` en [`src/config/schema.ts`](../../src/config/schema.ts).
2. Una rama nueva en `generate` ([`src/generate/index.ts`](../../src/generate/index.ts)) que emita los
   ficheros de la herramienta — reutiliza `composeBlocks` para que el contenido sea espejo de AGENTS.md.
3. La opción del wizard en [`src/commands/init.ts`](../../src/commands/init.ts).
4. Scope/ignore en [`src/generate/scope.ts`](../../src/generate/scope.ts) si la herramienta tiene su ignore.

Mantén AGENTS.md canónico: un target nuevo es una **proyección** de los mismos bloques, nunca una
segunda fuente de verdad.

---

## Añadir un comando del CLI

1. Crea `src/commands/<nombre>.ts` exportando una función `run<Nombre>(cwd, opts)`.
2. Regístralo en [`src/cli.ts`](../../src/cli.ts) con commander, envolviendo errores como los demás.
3. Si cambia artefactos, llama a `generate(cwd, config)` y `printArtifacts` para una salida consistente.

---

## Referencia rápida: dónde vive cada cosa

| Para cambiar… | Edita… |
|---------------|--------|
| El texto de una regla | el `.eta` correspondiente en `templates/` (+ `templates/i18n/es/`) |
| Una skill / stack pack | `skill-packs/<id>/` (`SKILL.md` + `references/` + `pack.yaml`); motor en `src/generate/stackPacks.ts` |
| Actualizar un pack vendorizado | `ai-workspace skills sync`; mirror del upstream en `vendor/` |
| Módulos disponibles | `src/modules/registry.ts` (lenguajes, frameworks, entornos, MCP) |
| Orden / qué bloques existen | `BLOCK_MANIFEST` en `src/generate/blockManifest.ts` (lo recorre `composeBlocks`) |
| Qué ficheros se escriben y cómo | `src/generate/index.ts` + los helpers `generate*` |
| Forma / defaults de la config | `src/config/schema.ts` |
| Preguntas del wizard | `src/commands/init.ts` |
| Idiomas / textos cortos | `src/i18n/strings.ts` + `templates/i18n/<locale>/` |
