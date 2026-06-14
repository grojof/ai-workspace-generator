# Extender

Recetas para añadir capacidades. Cada una termina con las **implicaciones**: qué cambia para los
usuarios que ya generaron un workspace.

> Regla de oro: un cambio en una plantilla `.eta` o en `composeBlocks` afecta al próximo `sync` de
> **todos**. Sube `TEMPLATES_VERSION` (ver [MANTENER](MAINTAINING.md)) y prefiere cambios aditivos.

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

Los entornos son una dimensión paralela a lenguajes/frameworks (id de bloque `env-<id>`), para
convenciones de herramientas/runtime (SO, gestores de versiones, contenedores, bases de datos). Mismo mecanismo:

1. Regístralo en `ENVIRONMENTS` en [`src/modules/registry.ts`](../../src/modules/registry.ts).
2. Opcionalmente añade `templates/environments/<id>/layer.md.eta` (+ `templates/i18n/es/...`). Sin
   plantilla, se emite un bloque genérico que apunta a context7.
3. Opcionalmente añade detección en [`src/detect/stack.ts`](../../src/detect/stack.ts) (p. ej. `Dockerfile` → docker).

Mantén estos bloques **breves** — convenciones de setup y gotchas, con el detalle por versión delegado a context7.

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

## Añadir una skill vendorizada

Las skills locales viven en `.claude/skills/` y las produce
[`src/generate/skills.ts`](../../src/generate/skills.ts) (SDD/living-docs) o
[`src/generate/guides.ts`](../../src/generate/guides.ts) (guía de aprendizaje, vscode-setup).

- Para una skill puntual, añade una llamada de escritura con el helper `frontmatter` (para que el
  `SKILL.md` tenga el `name`/`description`/`Trigger` correcto) y su variante es/en.
- Para una familia (como las fases SDD), guíate por una lista de datos — el set SDD se genera desde las
  fases de [`src/i18n/strings.ts`](../../src/i18n/strings.ts).

Las skills se emiten **solo si `targets` incluye `claude`**. Los equivalentes de Copilot son prompts en
`.github/prompts/`.

**Implicaciones:** se escriben con `writeFile` (sobrescritura), así que los cambios de plantilla llegan a
los usuarios en `sync`. Si renombras la carpeta de una skill, la antigua **no** se borra de los repos —
ver la nota de huérfanos en [MANTENER](MAINTAINING.md#renombrar-o-eliminar-un-id-de-bloque).

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
| Módulos disponibles | `src/modules/registry.ts` (lenguajes, frameworks, entornos, MCP) |
| Orden / qué bloques existen | `composeBlocks` en `src/generate/agents.ts` |
| Qué ficheros se escriben y cómo | `src/generate/index.ts` + los helpers `generate*` |
| Forma / defaults de la config | `src/config/schema.ts` |
| Preguntas del wizard | `src/commands/init.ts` |
| Idiomas / textos cortos | `src/i18n/strings.ts` + `templates/i18n/<locale>/` |
