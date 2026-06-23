# Extending

Recipes for adding capabilities. Each ends with the **implications**: what changes for users who already
generated a workspace.

> Golden rule: a change to a `.eta` template or to `composeBlocks` affects **everyone's** next `sync`. Bump
> `TEMPLATES_VERSION` (see [Maintaining](MAINTAINING.md)) and prefer additive changes.
>
> The **stable contracts** (block order and ids, idempotency, survival of text outside the markers, binary
> byte-equivalence) are *enforced* by [`test/invariants.test.js`](../../test/invariants.test.js) and
> documented in [ADR 0002](decisions/0002-extension-contracts.md). If you change block order/ids on purpose,
> update the golden in the same commit; if an invariant test goes red by accident, it's a bug.

---

## Add a stack module (language / framework / environment)

Since **0018** a stack module carries **no prose template**. Registering a language (`lang-<id>`), framework
(`fw-<id>`) or environment (`env-<id>`) only drives its **functional** outputs; the AGENTS.md block is a single
inline **context7 pointer** (`stackPointer` in [`references.ts`](../../src/generate/references.ts)). The durable
craft rules live once in the language-agnostic [engineering-practices baseline](#the-engineering-practices-baseline);
**stack- and project-specific** rules belong in a **skill pack** (next section), not a per-stack template.

1. **Register it** in [`src/modules/registry.ts`](../../src/modules/registry.ts) under `LANGUAGES` /
   `FRAMEWORKS` / `ENVIRONMENTS` (with its `vscodeExtensions` / `vscodeFormatter` where relevant):
   ```ts
   { id: "go", label: "Go", bundled: true, vscodeExtensions: ["golang.go"], vscodeFormatter: "golang.go" },
   ```
2. Optionally add **detection** in [`src/detect/stack.ts`](../../src/detect/stack.ts) (e.g. `go.mod` → go) so
   `detect` seeds the wizard.
3. **Done.** `add language go` + `sync` emits the `lang-go` block (heading + context7 line) and wires the
   functional outputs. No template, no `layer.md.eta`.

**To ship opinionated, decision-bearing rules for that stack** (e.g. "App Router by default", an Odoo module
layout), author a **stack pack** — see below.

---

## The engineering-practices baseline

The one evergreen, language-agnostic craft reference is
[`templates/references/engineering-practices.md.eta`](../../templates/references/engineering-practices.md.eta)
(rendered to `references/engineering-practices.md`), reached by the lean hub block
[`templates/core/engineering-practices.md.eta`](../../templates/core/engineering-practices.md.eta)
(`aiws:engineering-practices`). Edit the rules there — it must **not** restate Layer-0 *Universal conventions*,
and it stays **stack-agnostic** (anything stack-specific goes in a stack pack). Bump `TEMPLATES_VERSION` after
editing.

## Add an AGENTS.md block (principle / feature)

Block order and gating live as **data** in `BLOCK_MANIFEST`
([`src/generate/blockManifest.ts`](../../src/generate/blockManifest.ts)); `composeBlocks` just walks it
(declarative, manifest-driven compositor). Adding a top-level block is **one entry** in the array, not surgery
in the compositor:

```ts
// a template block, optionally gated:
{ kind: "template", id: "my-block", template: "core/my-block.md.eta", when: (c) => c.someFlag },
// or content from a render function:
{ kind: "render", id: "my-block", render: (c) => renderMyBlock(c) },
```

- The **position** in the array is the output order (a stable contract — the
  [`test/invariants.test.js`](../../test/invariants.test.js) golden pins it; if you change it on purpose,
  update the golden in the same commit).
- A new `id` is **additive**; bump `TEMPLATES_VERSION`. Renaming/removing an `id` orphans content
  ([Maintaining](MAINTAINING.md#renaming-or-removing-a-block-id)).
- `kind: "expand"` is for blocks derived from a config array (the `lang/fw/env` stack layers).

## Learning mode (purpose: learn)

`project.purpose: "learn"` turns the workspace into a tutoring environment: it adds a `learning` block to
AGENTS.md and an `aiws-learn` tutor skill + `/aiws-learn` command ([`src/generate/learning.ts`](../../src/generate/learning.ts)).
To extend the teaching behavior, edit that generator and `templates/core/learning.md.eta` (+ es).

## Add an MCP server

1. Add it to the `REGISTRY` in [`src/generate/mcp.ts`](../../src/generate/mcp.ts):
   ```ts
   const REGISTRY = {
     context7: { /* … */ },
     myserver: { command: "npx", args: ["-y", "@scope/my-mcp"], note: "…" },
   };
   ```
2. Add it to `MCPS` in [`src/modules/registry.ts`](../../src/modules/registry.ts) so `add mcp myserver` validates.
3. `.mcp.json` (Claude), `.vscode/mcp.json` (Copilot) and `.codex/config.toml` (Codex) are all emitted from
   the same registry.

**Implications:** users opt in with `add mcp <id>`; secrets go via env, never in templates.

---

## Add a stack pack (skills-as-data, like `odoo-18.0`)

The **recommended** way to add rich skills (stacks, company content) is as a **markdown pack** in
`skill-packs/<id>/` — *data*, not code (skills-as-data model). The generator
([`src/generate/stackPacks.ts`](../../src/generate/stackPacks.ts)) copies them into `.claude/skills/<id>/` when
they apply.

Pack structure:
- `skill-packs/<id>/SKILL.md` — index + frontmatter (the skill, *model-invoked*).
- `skill-packs/<id>/references/*.md` — on-demand guides (recommended for stacks; progressive disclosure).
- `skill-packs/<id>/pack.yaml` — **gating/routing metadata** (not copied to the workspace).
- `skill-packs/<id>/overlay.md` — optional **generic** overlay, **always** appended to `SKILL.md` as a managed
  block (e.g. to link the **project conventions** from `conventions.prefixes`).
- `skill-packs/<id>/overlay.<company>.md` — optional company overlay (appended as a managed block).
- `skill-packs/<id>/agents/<name>.md` — **companion subagents** shipped to `.claude/agents/` (only if the pack
  declares them in `pack.yaml` with `agents:`); `package` also includes them in the plugin.

`pack.yaml`:
```yaml
id: react-19
base: vendor/<repo>/...      # if it comes from a vendored source (for `skills sync`)
agents:                      # companion subagents → .claude/agents/; sync refreshes them from <dir>/SKILL.md
  - vendor/<repo>/agents/<name>
stackBinding:                 # copied when the stack is active in the config
  frameworks: [react]         # or languages / environments
profile:
  userType: [technical]
loadMode: on-demand
templated: false              # true → resolves {{paths.*}} when copied
routing: true                 # false → routing is handled by the catalog (src/modules/skills.ts)
relation: new                 # how this pack relates to the base — see below (company packs)
```

- **Relation to the base** (`relation:`, ADR 0003 — the auditable primitive `aiws-reconcile` reads):
  `new` (default) = an independent skill; `extends` = augments the base catalog; `overrides:<aiws-id>` =
  replaces/augments a named base skill. An `overrides:` target must be a reserved `aiws-*` id **and** name a
  real base skill (checked at load — a dangling override throws). Bundled base packs are all `new`; the field
  earns its keep for **company packs** that intentionally layer on or replace base content.
- **Feature/company gating** (no stack): use `gating:` (`gating.sdd.schema: reasons`, `gating.company: any|[example]`).
- **Vendor from a permissive source** (MIT/Apache-2.0/BSD/CC-BY — e.g. `agent-skills`, `anthropics/skills`):
  place the base in `vendor/<repo>/…`, point `base:` at it and maintain it with `ai-workspace skills sync` (see
  [Maintaining](MAINTAINING.md)). Verify the license **per-skill**; reject copyleft/share-alike and source-available.
- **Routing**: by default the pack contributes its `skill-routing` row (derived from `pack.yaml`); set
  `routing: false` if its routing lives in the catalog.

**Test:** a workspace with the stack active (e.g. `stack.frameworks: [react]`, technical profile) inherits the
full pack in `.claude/skills/react-19/` (with its `references/`).

## Company packs over git (ADR 0003 F2c)

A company keeps its own skills/overlays in a **separate git repo** and consumes the base as a dependency,
without forking. `company` is `{ id, packs }`:

```yaml
company:
  id: corp-acme            # personal/freelance = corp-<handle>; `none` = generic
  packs:
    - git+https://github.com/acme/ai-packs.git#v1.3.0   # pinned by tag/sha/branch (required)
```

The pack repo uses the **same `skill-packs/<id>/` layout** (one or more `corp-<handle>-*` packs, each a
`pack.yaml` + `SKILL.md` + optional `references/`, with a `relation:`). Then:

```bash
ai-workspace packs sync   # clones each ref, vendors into .ai-workspace/packs/<id>/ (committed), writes packs-lock.json
ai-workspace sync         # generate now also emits the company packs (gated by profile/stack/company)
```

- **Pinned + vendored + committed:** the network is touched only at `packs sync`, never at `generate`.
  `packs-lock.json` records the resolved sha for reproducibility. Review `.ai-workspace/packs/` in PRs.
- **Reserved-namespace guard:** an external pack may **not** claim an `aiws-*` / `aiws:*` id — only the base
  may. Use a `corp-<handle>-` id. The guard runs at `packs sync` and at load.
- **Relations** (`relation: overrides:<aiws-id>`) are validated against the live base catalog (a dangling
  override throws). Company-owned skills are **not** tracked by the integrity manifest (only `aiws-*` are).

> Updating: bump the `#ref`, re-run `packs sync`, review the diff. `aiws-reconcile` (planned) will audit the
> company overlay against the base on each upgrade.

## Add a native tool skill

The generator's *own* skills (lean SDD flow, `aiws-living-docs`, learning guide, `aiws-vscode-setup`) are still produced
by code: [`src/generate/skills.ts`](../../src/generate/skills.ts) (SDD/aiws-living-docs) and
[`src/generate/guides.ts`](../../src/generate/guides.ts). For a one-off skill, write it with the `frontmatter`
helper. Skills are emitted **only if `targets` includes `claude`**; the Copilot equivalent are prompts in
`.github/prompts/`. (All the **fusion** content — sdd-builder/audit/schema/onboarding/migrate, corp-* — already
lives as markdown packs, not in code.)

**Implications:** packs and native skills are written with `writeFile` (overwrite) → changes arrive on `sync`.
If you rename a pack/skill, the old folder is **not** removed from repos — see the orphan note in
[Maintaining](MAINTAINING.md#renaming-or-removing-a-block-id).

---

## Add a language (locale)

1. Add the value to the `language` enum in [`src/config/schema.ts`](../../src/config/schema.ts).
2. Add its entry in [`src/i18n/strings.ts`](../../src/i18n/strings.ts) (short strings + SDD phases).
3. Create `templates/i18n/<locale>/` with the templates to translate (the English base is the fallback).
4. Localize the mid-length prose in `sdd.ts`, `skills.ts`, `livingDocs.ts`, `guides.ts` per locale.
5. Add the option to the wizard in [`src/commands/init.ts`](../../src/commands/init.ts).

---

## Add a new target (e.g. Cursor)

A bigger change. Points to touch (the `codex` target is a worked example, see change 0006):

1. The `targets` enum in [`src/config/schema.ts`](../../src/config/schema.ts).
2. A new branch in `generate` ([`src/generate/index.ts`](../../src/generate/index.ts)) that emits the tool's
   files — reuse `composeBlocks` so the content mirrors AGENTS.md (or, like Codex, rely on AGENTS.md directly).
3. The wizard option in [`src/commands/init.ts`](../../src/commands/init.ts).
4. Scope/ignore in [`src/generate/scope.ts`](../../src/generate/scope.ts) if the tool has its own ignore.

Keep AGENTS.md canonical: a new target is a **projection** of the same blocks, never a second source of truth.

---

## Add a CLI command

1. Create `src/commands/<name>.ts` exporting a `run<Name>(cwd, opts)` function.
2. Register it in [`src/cli.ts`](../../src/cli.ts) with commander, wrapping errors like the others.
3. If it changes artifacts, call `generate(cwd, config)` and `printArtifacts` for consistent output.

---

## Quick reference: where each thing lives

| To change… | Edit… |
|------------|-------|
| A rule's wording | the matching `.eta` in `templates/` (+ `templates/i18n/es/`) |
| A skill / stack pack | `skill-packs/<id>/` (`SKILL.md` + `references/` + `pack.yaml`); engine in `src/generate/stackPacks.ts` |
| Update a vendored pack | `ai-workspace skills sync`; upstream mirror in `vendor/` |
| Available modules | `src/modules/registry.ts` (languages, frameworks, environments, MCP) |
| Order / which blocks exist | `BLOCK_MANIFEST` in `src/generate/blockManifest.ts` (walked by `composeBlocks`) |
| Which files are written and how | `src/generate/index.ts` + the `generate*` helpers |
| Config shape / defaults | `src/config/schema.ts` |
| Wizard questions | `src/commands/init.ts` |
| Languages / short strings | `src/i18n/strings.ts` + `templates/i18n/<locale>/` |
