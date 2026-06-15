# Extending

Recipes for adding capabilities. Each ends with the **implications** — what changes for users who
already generated a workspace.

> Golden rule: a change to a `.eta` template or to `composeBlocks` is a change to **everyone's** future
> `sync`. Bump `TEMPLATES_VERSION` (see [MAINTAINING](MAINTAINING.md)) and prefer additive changes.

---

## Add a language module (e.g. Go)

A language works **without** a bundled template (a generic block is emitted). Adding a template just
makes the guidance richer.

1. **Register it** in [`src/modules/registry.ts`](../src/modules/registry.ts):
   ```ts
   export const LANGUAGES: ModuleEntry[] = [
     // …
     { id: "go", label: "Go", bundled: true },
   ];
   ```
2. **Write the fragment** at `templates/languages/go/layer.md.eta`. It receives the full config plus the
   matched entry as `it.entry`:
   ```eta
   ## Go (Layer 1 — language) · target v<%= it.entry.version %>

   - Format with `gofmt`/`goimports`; vet with `go vet`. CI fails on diffs.
   - Errors are values: wrap with `%w`, never ignore. No panics across package boundaries.

   > For current best practices, query **context7** for `go@<%= it.entry.version %>`.
   ```
3. **Done.** `composeBlocks` ([`src/generate/agents.ts`](../src/generate/agents.ts)) auto-discovers the
   template via `templateExists("languages/go/layer.md.eta")`; no code change needed there.

**Test:** `ai-workspace add language go` in a scratch repo, then check the `lang-go` block in AGENTS.md.

**Implications:** existing users only get it when they add Go (`add language go`) and run `sync`. If you
edited an *existing* language template, they get the new text on their next `sync`/`upgrade` (their
manual notes outside the block survive).

---

## Add a framework module (e.g. Next.js)

Identical shape to a language, under `templates/frameworks/<id>/layer.md.eta`, registered in
`FRAMEWORKS`. The block id is `fw-<id>` and the fallback (no template) is handled by `renderFramework`
in [`agents.ts`](../src/generate/agents.ts).

```eta
## Next.js (Layer 2 — framework) · target v<%= it.entry.version %>

- App Router by default; Server Components unless interactivity is required.
- Co-locate route handlers; keep `use client` boundaries small.

> Query **context7** for `next@<%= it.entry.version %>`.
```

**Implications:** same as languages. Adding the template never breaks repos that don't use the framework.

---

## Add an environment module (e.g. WSL, Docker, a database)

Environments are a parallel dimension to languages/frameworks (block id `env-<id>`), for tooling/runtime
conventions (OS, version managers, containers, databases). Same mechanism:

1. Register it in `ENVIRONMENTS` in [`src/modules/registry.ts`](../src/modules/registry.ts).
2. Optionally add `templates/environments/<id>/layer.md.eta` (+ `templates/i18n/es/...`). Without a
   template, a generic block pointing to context7 is emitted.
3. Optionally add detection in [`src/detect/stack.ts`](../src/detect/stack.ts) (e.g. `Dockerfile` → docker).

Keep these blocks **short** — setup conventions and gotchas, with version detail delegated to context7.

## Learning mode (purpose: learn)

`project.purpose: "learn"` turns the workspace into a tutoring sandbox: it adds a `learning` block to
AGENTS.md and a `learn` tutor skill + `/learn` command ([`src/generate/learning.ts`](../src/generate/learning.ts)).
To extend the teaching behavior, edit that generator and `templates/core/learning.md.eta` (+ es).

## Add an MCP server (e.g. a docs or DB server)

1. Add it to the `REGISTRY` in [`src/generate/mcp.ts`](../src/generate/mcp.ts):
   ```ts
   const REGISTRY = {
     context7: { /* … */ },
     myserver: { command: "npx", args: ["-y", "@scope/my-mcp"], note: "…" },
   };
   ```
2. Add it to `MCPS` in [`src/modules/registry.ts`](../src/modules/registry.ts) so `add mcp myserver`
   validates.
3. Both `.mcp.json` (Claude) and `.vscode/mcp.json` (Copilot) are emitted from the same registry by
   `buildClaudeMcp` / `buildVscodeMcp`.

**Implications:** users opt in with `add mcp <id>`; secrets must go through env, never committed — keep
them out of templates and document them in the server's `note`.

---

## Add a vendored skill

Project-local skills live under `.claude/skills/` and are produced by
[`src/generate/skills.ts`](../src/generate/skills.ts). To add one:

- For a one-off skill, append a writer call in `generateSkills` using the `frontmatter` helper (so the
  `SKILL.md` has the right `name`/`description`/`Trigger`).
- For a family (like the SDD phases), drive it from a data list — the SDD set is generated from the
  localized `phases` in [`src/i18n/strings.ts`](../src/i18n/strings.ts), filtered per config by
  `phasesFor` / `usesConstitution` in [`src/generate/sdd.ts`](../src/generate/sdd.ts).

Skills are emitted **only when `targets` includes `claude`**. Copilot equivalents are prompt files under
`.github/prompts/` (see how SDD does both).

**Implications:** skills are written with `writeFile` (overwrite), so template changes reach users on
`sync`. If you rename a skill folder, the old one is **not** deleted from users' repos — see the
orphaning note in [MAINTAINING](MAINTAINING.md#renaming-or-removing-a-block-id).

---

## Add a new target tool (e.g. Cursor)

Bigger change. Touch points:

1. `targets` enum in [`src/config/schema.ts`](../src/config/schema.ts).
2. A new branch in `generate` ([`src/generate/index.ts`](../src/generate/index.ts)) that emits the
   tool's files — reuse `composeBlocks` so the content stays a mirror of AGENTS.md.
3. The wizard option in [`src/commands/init.ts`](../src/commands/init.ts).
4. Scope/ignore in [`src/generate/scope.ts`](../src/generate/scope.ts) if the tool has its own ignore file.

Keep AGENTS.md canonical: a new target should be a **projection** of the same blocks, never a second
source of truth.

---

## Add a new layer fragment or section

To add a new always-on section (e.g. "Accessibility"), add a template under `templates/core/` and push a
block in `composeBlocks` with a **new, unique id**. Choose the id carefully — it becomes a permanent
marker in users' files.

---

## Add a CLI command

1. Create `src/commands/<name>.ts` exporting a `run<Name>(cwd, opts)` function.
2. Register it in [`src/cli.ts`](../src/cli.ts) with commander, wrapping errors like the others.
3. If it changes artifacts, call `generate(cwd, config)` and `printArtifacts` so output is consistent.

---

## Quick reference: where things live

| To change… | Edit… |
|------------|-------|
| A rule's wording | the relevant `.eta` in `templates/` |
| Available modules | `src/modules/registry.ts` (languages, frameworks, environments, MCP) |
| Block order / which blocks exist | `composeBlocks` in `src/generate/agents.ts` |
| Which files are written & how | `src/generate/index.ts` + the `generate*` helpers |
| Config shape / defaults | `src/config/schema.ts` |
| Wizard questions | `src/commands/init.ts` |
