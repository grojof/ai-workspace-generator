# vendor/agent-skills — packs MIT de stack (upstream)

Subconjunto **vendorizado** de [`unclecatvn/agent-skills`](https://github.com/unclecatvn/agent-skills)
(**MIT**), pineado en **`v1.0.10`** (`a9a609b`). Es la **capa BASE** de los packs de stack; cualquier overlay
de empresa se mantiene **aparte** como `overlay.<company>.md` en el pack (no se mezcla aquí). Ver `.source.json` para la procedencia.

> **No editar a mano.** Se actualiza vía sync (pin por tag + bump revisado). Al traer un drop
> nuevo, el `git diff` muestra los cambios del upstream con claridad.

## Vendorizado

| Pack | Qué es |
|------|--------|
| `skills/odoo-18.0/` | Stack Odoo 18: `SKILL.md` índice + `references/` (19 guías: model, fields, security, testing, OWL, performance, migration… + `api-highlights.md`) |
| `agents/odoo-code-review/` | Agente de revisión de código Odoo (version-aware) |
| `agents/odoo-code-tracer/` | Agente de trazado de código Odoo |

Disponibles en upstream y **no** vendorizados aún (añadir si hace falta): `odoo-17.0`, `odoo-19.0`,
`payment-integration`, `code-review`, `mcp-builder`, `dtg-base`, `brainstorming`, `writing-skills`, `slide`.

## Licencia / atribución

MIT — © unclecatvn (ver [`LICENSE`](LICENSE)). Se conserva el aviso de copyright al vendorizar y redistribuir.
