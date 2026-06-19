# Proposal — Multi-repo polish (Copilot per-repo · catalog de-hardcode · plugin-per-repo)

## Intent
Close three follow-ups left after 0003/0004, all about finishing multi-repo parity and keeping the module
**registry the single source**:

1. **Copilot per-repo guidance (R1).** Copilot reads one workspace-root file (no nested discovery), so 0003
   left child repos without Copilot-specific guidance. Use Copilot's native **`applyTo` path-scoped
   instructions**: emit one `.github/instructions/<repo>.instructions.md` per child repo, scoped to its path.
2. **Broader de-hardcode (R2).** `init`/`add`/`remove` already read the registry, but `guides.ts` still
   hardcodes the language→VS Code tooling map and `doctor` validates only MCP ids (not stack ids). Move the
   VS Code recommendations/formatters into the registry and have `doctor` validate stack ids against it. Fix
   the `add` CLI help (it omits `environment`, which the command already supports).
3. **One-plugin-per-repo (R3, optional).** Add `distribution.perRepo` so `package` can emit one plugin per
   child repo (each = root workflow skills + that repo's stack skills) instead of the single umbrella.
   Default `false` ⇒ today's umbrella.

## Scope
- **R1:** in the workspace phase, for each `resolveRepos()` child, write `.github/instructions/<slug>.instructions.md`
  with `applyTo: "<path>/**"` summarizing that repo's stack and pointing to its rules/skills. Single-repo
  (empty `repos[]`) emits none → unchanged.
- **R2:** `ModuleEntry` gains optional `vscodeExtensions?: string[]` and `vscodeFormatter?: string`;
  `extensionsJson`/`settingsJson` derive from the registry (byte-identical for current stacks). `doctor` warns
  on configured stack ids absent from the registry (parity with the MCP check). `add` command help lists
  `environment`. The `.vscode` recommendations use the **union** stack in multi-repo.
- **R3:** `DistributionSchema.perRepo: boolean = false`. When `true` and multi-repo, `package` writes one
  plugin per child (`plugins/<plugin>-<repoSlug>/`, sources = root + that child) and a multi-plugin
  marketplace; org zips + INSTALL stay the aggregate. Default keeps the umbrella path untouched.

## Out of scope
- Per-repo divergent profile/company/SDD/language (`RepoSchema` still overrides `stack` only).
- De-hardcoding editor settings beyond extensions/formatter (e.g. the Node/ESLint global block).
- Per-repo org-skill zips (org skills are org-wide).

## Risks
- **Single-repo / default drift.** R2 must keep `.vscode/*` byte-identical for current stacks; R3's umbrella
  path must be untouched when `perRepo=false`. *Mitigation:* derive registry order to reproduce today's
  output exactly; golden-ish assertions + idempotency; `perRepo` defaults false.

## Acceptance
- Multi-repo emits a per-child `.github/instructions/<slug>.instructions.md` with the right `applyTo`;
  single-repo emits none.
- VS Code recommendations/formatters come from the registry; output for ts/go/python stacks is unchanged.
- `doctor` warns on an unknown stack id; `add` help lists `environment`.
- `distribution.perRepo: true` packages one plugin per child; default `false` is byte-identical to 0004.
- `npm run build` + full suite green; second `sync`/`package` idempotent.
