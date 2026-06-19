# Design — Multi-repo polish

Three independent slices on one branch; each keeps its default/single-repo path byte-identical.

## R1 — Copilot per-repo `applyTo` instructions
Copilot's native per-path mechanism is `.github/instructions/*.instructions.md` with an `applyTo` glob (read
from the workspace root). In `generateWorkspace`, after the existing TS instruction, loop the child repos:

```ts
for (const repo of resolveRepos(config)) {
  if (repo.path === ".") continue;            // single-repo emits none
  const slug = kebabPath(repo.path);
  add(writeFile(resolve(cwd, ".github/instructions", `${slug}.instructions.md`),
      repoInstruction(repo, es)), t.desc.tsInstructions);
}
```
`repoInstruction` front-matter `applyTo: "<path>/**"`; body names the repo's languages/frameworks and says to
apply the matching `AGENTS.md` layers, with stack skills under `<path>/.claude/skills`. Gated on
`config.targets.includes("copilot")`. Idempotent (`writeFile` reports unchanged on re-run).

## R2 — Registry-driven VS Code tooling + doctor validation
`src/modules/registry.ts` — extend `ModuleEntry`:
```ts
export interface ModuleEntry {
  id: string; label: string; bundled?: boolean;
  vscodeExtensions?: string[];   // recommended when this module is in the stack
  vscodeFormatter?: string;      // `[lang]` editor.defaultFormatter
}
```
Populate to reproduce today's map exactly: `typescript`/`javascript` → `["dbaeumer.vscode-eslint",
"esbenp.prettier-vscode"]`; `go` → ext `["golang.go"]`, formatter `golang.go`; `python` → ext
`["ms-python.python"]`, formatter `charliermarsh.ruff`.

`src/generate/guides.ts` — derive from the registry, preserving order/dedup so output is byte-identical:
```ts
function stackModules(config): ModuleEntry[] {            // catalog order: languages, frameworks, environments
  const ids = { ... from config.stack ... };
  return [...LANGUAGES, ...FRAMEWORKS, ...ENVIRONMENTS].filter(m => ids.has(m.id));
}
// extensionsJson: base + dedup(stackModules.flatMap(m => m.vscodeExtensions ?? [])) + "bierner.markdown-mermaid"
// settingsJson: keep the Node/ESLint global block (usesNode); then a `[lang]` block per language with vscodeFormatter
```
- Order: registry catalog order matches today (ts/js, go, python), so the dedup’d list reproduces the current
  output. The Node/ESLint global settings block (TS/JS) stays special-cased.
- `generateVscode` is called with the **union** stack (multi-repo covers every repo); single-repo union ==
  root → unchanged.

`src/commands/doctor.ts` — add stack-id validation against the registry (parity with MCP):
```ts
for (const [type, items] of [["language", config.stack.languages], ["framework", config.stack.frameworks], ["environment", config.stack.environments]])
  for (const it of items) if (!find(type, it.id)) findings.push({ level: "warn", message: `Unknown ${type} "${it.id}" (not in registry).` });
```
Use `unionStack(config)` so child stacks are covered.

`src/cli.ts` — `add` description/argument help lists `environment` (the command already supports it).

## R3 — Optional one-plugin-per-repo distribution
`src/config/schema.ts` — `DistributionSchema.perRepo: z.boolean().default(false)`.

`src/generate/packaging.ts` — a per-repo plugin id helper + a marketplace builder that takes N plugins:
```ts
export function repoPluginName(config, repoName): string  // `${names(config).plugin}-${kebab(repoName)}`
export function marketplaceManifestMulti(config, plugins: {name; source; description}[]): Record<string, unknown>
```

`src/commands/package.ts`:
```ts
if (config.distribution.perRepo && config.repos.length) {
  for (const repo of resolveRepos(config)) {
    const roots = [cwd, resolve(cwd, repo.path)];          // root + this child only
    const dir = resolve(cwd, "plugins", repoPluginName(config, repo.name));
    // plugin.json + projectTree(skills/commands/agents) from `roots`
  }
  // marketplace lists every per-repo plugin
} else {
  // today's umbrella path (unchanged)
}
// org zips + INSTALL.md: always from the full aggregate (sourceRoots(cwd, config))
```
Default `perRepo=false` ⇒ the umbrella branch runs exactly as in 0004 (byte-identical). `collectEntries`,
`projectTree`, `sourceRoots` from 0004 are reused.

## Tests
- R1: multi-repo generate → `.github/instructions/app-a.instructions.md` with `applyTo: "app-a/**"`;
  single-repo → none; TS instruction still present.
- R2: registry drives `.vscode/extensions.json` (ts→eslint+prettier, go→golang.go, python→ms-python) and
  `settings.json` formatters — assert byte-identical to current for a ts/go/python config; `doctor` warns on
  a bogus stack id; `find("environment", …)` works.
- R3: `perRepo:true` multi-repo → `plugins/<plugin>-app-a/skills/odoo-18.0/SKILL.md` +
  `plugins/<plugin>-app-b/skills/frontend-ui-dark-ts/SKILL.md` + marketplace lists both; `perRepo:false`
  unchanged; idempotent.

## Risks / mitigations
- *VS Code byte drift* — reproduce today's order/dedup from registry catalog order; assert equality in tests.
- *Distribution default drift* — `perRepo` defaults false; the umbrella branch is the existing code path,
  untouched.
