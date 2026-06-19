# Distribución e instalación (F6)

> Cómo empaquetar un workspace generado para que se **instale** en las tres superficies de Claude:
> VS Code/CLI, Claude Desktop/Cowork y la organización de empresa en claude.ai (Desktop + Workspace).

El generador produce config *standalone* en `.claude/` (perfecto para un repo). Para **distribuirlo** a
varios usuarios, el comando **`ai-workspace package`** proyecta esos artefactos a un **plugin de Claude
Code** servido desde el propio repo como **marketplace privado**, y prepara **zips de skill** para subir a
la organización. Es otra *proyección* de la misma fuente única — `AGENTS.md` no se duplica.

```bash
ai-workspace package
```

## Nombre de plugin estable para la organización

Por defecto el plugin y el marketplace se derivan del nombre del repo. Para publicar un **plugin canónico
de la org** (p. ej. `acme-ai-workspace`) que **conviva con otros plugins** de la organización en
un solo marketplace privado, fija los nombres en la config:

```yaml
# workspace.config.yaml
distribution:
  plugin: acme-ai-workspace   # id del plugin (kebab-case)
  marketplace: acme-tools     # id del marketplace (kebab-case)
  owner: Acme IT              # autor mostrado en los manifiestos
```

Así el id es **independiente del repo** que lo consume: puedes mantener un repo de referencia que produce
siempre el mismo `acme-ai-workspace`, y consolidar varios plugins de la org en un único marketplace.

## Qué genera

| Artefacto | Para qué |
|-----------|----------|
| `.claude-plugin/marketplace.json` (raíz) | Convierte **este repo** en un marketplace privado (`metadata.pluginRoot: ./plugins`). |
| `plugins/<slug>/.claude-plugin/plugin.json` + `skills/` + `commands/` | El **plugin paraguas** con todas las skills y comandos generados. |
| `dist/org-skills/<id>.zip` (uno por skill, `SKILL.md` en la raíz) | Subida de **skills a la organización** claude.ai. |
| `dist/INSTALL.md` | Guía de instalación por superficie (con la URL del remoto git). |

> **Versionar:** commitea `.claude-plugin/marketplace.json` y `plugins/<slug>/` (el marketplace los sirve).
> `dist/` es salida de build (zips + guía) — opcional en git. Re-ejecutar `package` es determinista (no-op).

## Las tres superficies

### 1. VS Code / CLI (Claude Code) — desarrolladores
El repo es el marketplace. En Claude Code:

```
/plugin marketplace add <owner/repo o URL git de este repo>
/plugin install <slug>@<marketplace>
```

Repo **privado** (p. ej. GHE): Claude Code usa tus credenciales git existentes (`gh auth login`, agente
SSH). Para auto-updates en segundo plano, exporta un token (`GITHUB_TOKEN`/`GH_TOKEN`, o `GITLAB_TOKEN`).
Actualizar: `/plugin marketplace update <marketplace>`.

### 2. Claude Desktop / Cowork (individual)
Usa la carpeta del plugin con `claude --plugin-dir ./plugins/<slug>`, o sírvela como `.zip` y cárgala con
`--plugin-url <url>`.

### 3. claude.ai Team/Enterprise — Desktop + Workspace para todos
Un **Owner** de la organización sube los zips de `dist/org-skills/` en **Organization settings → Skills →
+ Add** (cada zip lleva `SKILL.md` en la raíz). Requiere activar *Code execution and file creation* y
*Skills* en la organización. Las skills quedan provisionadas a todos (web, Desktop, Cowork), activas por
defecto; cada miembro puede desactivarlas. **Solo los Owners** pueden añadir/quitar skills de organización.

## Notas de diseño

- **Plugin paraguas** (no dividido) por ahora: una sola instalación. Se puede dividir por dominio más
  adelante sin romper la fuente única.
- El escritor ZIP es propio (`src/util/zip.ts`, método *store*, sin dependencias, compatible con Node ≥20)
  y **determinista** (timestamp fijo) → los zips son byte-idénticos entre ejecuciones.
- El plugin de Claude Code **namespacea** las skills: se invocan como `/<slug>:<skill>`.

## Fuentes (documentación oficial Claude, verificada)

- [Create plugins](https://code.claude.com/docs/en/plugins) · [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Provision and manage skills for your organization](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization)
