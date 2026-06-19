# Spec — Multi-repo polish

> Delta against `docs/development/specs/configuration.md` (the multi-repo generation/distribution baseline
> from 0003/0004).

## R1 — Copilot per-repo `applyTo` instructions
For a multi-repo workspace, generation MUST emit one Copilot path-scoped instruction per child repo.

- **Given** populated `repos[]`, **then** for each `resolveRepos()` entry with `path !== "."` a file
  `.github/instructions/<slug>.instructions.md` is written at the workspace root with front-matter
  `applyTo: "<path>/**"` and a short body naming the repo's stack and its rules/skills location.
- **Given** empty `repos[]`, **then** no per-repo instruction is emitted (single-repo output unchanged; the
  existing TypeScript path-scoped instruction is preserved).

## R2 — Registry is the single source for VS Code tooling + doctor stack validation
- **Given** a language/framework/environment with `vscodeExtensions`/`vscodeFormatter` in the registry,
  **when** generating `.vscode/extensions.json` / `settings.json`, **then** those values are used (no
  hardcoded language map in `guides.ts`).
- **Given** a current ts/go/python stack, **then** the generated `.vscode/*` files are byte-identical to
  before this change.
- **Given** a configured stack id not present in the registry, **when** `doctor` runs, **then** it warns
  (parity with the existing unknown-MCP warning).
- **Given** the `add` command help, **then** it lists `environment` among the module types.
- **Given** a multi-repo workspace, **then** `.vscode` recommendations reflect the **union** of repo stacks.

## R3 — Optional one-plugin-per-repo distribution
`package` MUST support emitting one plugin per child repo, gated by `distribution.perRepo`.

- **Given** `distribution.perRepo: true` and populated `repos[]`, **then** `package` writes one plugin per
  child (`plugins/<plugin>-<repoSlug>/`) whose skills/commands/agents aggregate the **root + that child**
  (deduped, first-wins), and a marketplace catalog listing every per-repo plugin.
- **Given** `distribution.perRepo: false` (default), **then** `package` produces the single umbrella plugin
  exactly as in 0004 (byte-identical).
- **Given** any `perRepo` value, **then** the per-skill org zips and `INSTALL.md` are built from the full
  aggregate (org skills are org-wide), and a second `package` is a no-op.

## Acceptance
Per-repo Copilot instructions in multi-repo (none in single-repo); VS Code tooling + doctor validation driven
by the registry with byte-identical current output; `add` help fixed; `perRepo` toggles per-repo vs umbrella
plugins with the default unchanged; build + suite green; idempotent.
