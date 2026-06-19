## Project conventions for Odoo addons

Apply **this project's naming conventions** to all custom Odoo work. They are defined in
`workspace.config.yaml` → `conventions` (`prefixes`, `banned`, `notes`) and surfaced in `AGENTS.md`.
Never invent a prefix — use the one configured; if none is configured, follow Odoo/OCA conventions.

- **Modules / addons:** `<prefix>_<module_name>` (e.g. a `prefixes.module` of `abc` → `abc_sales_extension`).
- **Models:** `<prefix>.<model_name>` for the technical `_name`.
- **XML ids** (views, actions, menus, security): `<prefix>_<model>_<type>` (e.g. `abc_sale_order_form`).
- **Custom fields:** apply the configured field prefix where the convention requires it.

> Companion agents (shipped to `.claude/agents/`): **odoo-code-review**, **odoo-code-tracer**.
