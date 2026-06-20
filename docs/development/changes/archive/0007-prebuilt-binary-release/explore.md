# Exploration: 0007 — prebuilt binary / direct-download release

> Status: exploration (feasibility). No code touched. Distribution is outward-facing (Releases/CI) →
> Safety gate: present options, recommend, await decision before any publishing step.

## Goal

Let the AI (or any human) grab a **direct artifact for the latest version** without cloning + building and
**without an npm account** (user wants to avoid npm-registry bureaucracy for now). User preference: a
**binary they can regenerate locally and upload to a GitHub Release** on each new version — *only if not too
complicated*.

## Current State

- **Runtime is filesystem-coupled to shipped assets.** The CLI is ESM, Node ≥20, entry `dist/cli.js`.
  - `templates/` resolved at runtime from the module location: `resolve(dirname(fileURLToPath(import.meta.url)), "../../templates")` — [src/render/engine.ts:7-15](../../../../src/render/engine.ts).
  - `skill-packs/` resolved the same way — [src/generate/stackPacks.ts:90-94](../../../../src/generate/stackPacks.ts).
  - **eta reads `.eta` files from disk at render time** (`new Eta({ views: templatesDir() })` → `engine().render(relPath)`), plus `existsSync` probes for i18n overrides and template existence. This is the crux: templates are *not* `import`ed, they are read as files on demand.
- **`npm pack` already bundles the right assets.** `package.json` `files: ["dist","templates","skill-packs"]`, `bin.ai-workspace → dist/cli.js`, `engines.node >=20`. A `npm pack` tarball is already a complete, runnable artifact.
- **Runtime deps are pure JS** (commander, eta, picocolors, yaml, zod, @clack/prompts) — no native addons → bundling/SEA is technically possible.
- **No release pipeline.** `.github/workflows/ci.yml` only runs typecheck + tests on Node 20/22. `package.json.version` is `0.1.0` and `src/cli.ts` hardcodes `.version("0.1.0")` (drift risk).
- **A `package` command already exists** (`ai-workspace package` → plugin + marketplace + org-skill zips) and there is a `src/util/zip.ts` helper — reusable plumbing for a portable-zip route.

## Affected Areas

- `package.json` — add a `pack`/`release` script; `files` already correct.
- `.github/workflows/` — optional `release.yml` (tag-triggered) to attach the artifact; or purely-local `npm pack` + `gh release create` (no CI needed for the local-build path the user prefers).
- `src/render/engine.ts`, `src/generate/stackPacks.ts` — **only** if we go true-SEA: reroute asset reads to embedded assets (high impact, see Option C).
- `src/cli.ts` / `src/version.ts` — single-source the CLI version (currently hardcoded) so the artifact name/`--version` track the release.
- `docs/project/USAGE.md` (+ `USAGE.es.md`) and the **GitHub wiki quickstart (ES)** — document easy install + update.
- `README.md` / `README.es.md` — install section.

## Approaches

| # | Approach | No npm acct? | Needs Node on user? | Asset refactor? | Per-OS build/sign? | Effort |
|---|----------|:---:|:---:|:---:|:---:|:---:|
| A | **`npm pack` .tgz attached to a Release** | ✅ | Yes | No | No | **Very Low** |
| B | **Portable zip** (dist+templates+skill-packs+prod node_modules+launcher) | ✅ | Yes (no install step) | No | No | Low |
| C | **True Node SEA single binary** | ✅ | **No** | **Yes (big)** | **Yes** | High |
| D | esbuild single `.mjs` + inlined templates, run with Node | ✅ | Yes | Medium | No | Medium |

1. **A — `npm pack` tarball on GitHub Releases.** `npm pack` → `ai-workspace-generator-<v>.tgz` (already contains dist + templates + skill-packs). Upload with `gh release create v<v> *.tgz`. Install: `npm i -g <release-tgz-url>` (or `npx <tgz>` / the AI installs it). Update = download newer tarball + reinstall.
   - Pros: **zero asset refactor** (filesystem resolution unchanged); one-command local regen; trivial to upload; works offline-ish (only the 6 runtime deps fetched on install); reuses existing `files`. Matches "generate locally + upload" exactly.
   - Cons: not literally a "binary" — needs Node/npm present (covered by change 0008 guided-install, which installs Node when missing); global install touches the user's npm prefix.
   - Effort: **Very Low**.

2. **B — Portable zip.** Bundle dist + templates + skill-packs + production `node_modules` + a `ai-workspace.cmd`/`.sh` launcher (`node "<dir>/dist/cli.js" "$@"`). Unzip anywhere, run; no install, no network.
   - Pros: no `npm install` at all (fully offline); no global-prefix mutation; still no asset refactor; reuses `src/util/zip.ts`.
   - Cons: larger artifact; still needs a Node runtime on PATH; launcher is per-OS (two tiny scripts); PATH/shim ergonomics to document.
   - Effort: Low.

3. **C — True Node SEA binary (no Node needed).** esbuild → single bundle; `node --experimental-sea-config`; inject blob into a copy of the `node` binary via `postject`; codesign (macOS notarization / Windows Authenticode) or users hit Gatekeeper/SmartScreen.
   - Pros: a genuine standalone executable; no Node on the user's machine; the cleanest end-user "download and run".
   - Cons: **eta's `views` filesystem model and the `import.meta.url` asset resolution don't work inside a SEA** — must move every template/skill-pack read to embedded **SEA assets** (`sea.getAsset`) and replace eta's `views` with an in-memory template loader (touches engine.ts, stackPacks.ts, i18n existence probes, `package` command). Cannot cross-build the injected binary → **one artifact per OS/arch**, so "generate locally" only yields the user's own platform unless a CI matrix builds the rest. Signing/notarization is real work and partly paid (Apple). SEA is still flagged `--experimental`.
   - Effort: **High**. Contradicts "not too complicated" and "generate locally".

4. **D — esbuild single `.mjs` with inlined templates.** One file, but still needs Node and still needs templates inlined (a virtual FS) → same eta-rerouting cost as C without the no-Node payoff.
   - Pros: single file.
   - Cons: needs Node anyway; medium refactor for little gain over A.
   - Effort: Medium.

## Recommendation

**Adopt A (`npm pack` tarball on GitHub Releases) as the v1 direct-download artifact**, with B (portable zip)
as an easy follow-on if a no-install / offline path is wanted. Defer C (true SEA binary) to a separate,
explicitly-scoped change — it is the only approach that removes the Node dependency, but it requires an asset
re-architecture + per-OS signing/CI that directly conflicts with "not too complicated" and "build locally".

Rationale: the user's real requirements are **(1) no npm account, (2) regenerate locally, (3) upload to
Releases, (4) direct download for the AI/anyone**. A satisfies all four today with ~no code change, because a
`.tgz` is a local artifact, *not* an npm-registry publish. The remaining gap (needs Node present) is exactly
what change **0008 (guided-install)** handles by detecting/installing Node per-OS. Honest framing for the user:
"binary" here pragmatically means *prebuilt installable artifact*; a literal Node-less executable is possible
but is a bigger, separate effort.

Concrete v1 shape:
- `npm run release:local` → `npm pack` + `gh release create v<version> <tgz> --notes ...` (local, no CI secret).
- Single-source the version (`src/version.ts` → `package.json`/`cli.ts`) so artifact name + `--version` match.
- Optional `release.yml` (tag-triggered) later to automate attach — opt-in, not required for the local flow.
- Docs + **wiki quickstart (ES)**: one-liner install `npm i -g <release-tgz-url>` and update steps; expert/manual (clone + build) path alongside.

## Risks

- **Mislabeling.** Calling A a "binary" may disappoint if the user expected a Node-less .exe. Set expectations now; offer C as a tracked future change.
- **Node prerequisite** for A/B — acceptable only because 0008 covers Node bootstrap; sequence 0008 to depend on this.
- **Global install side effects** (`npm i -g`) — document the `npx <tgz>` / portable-zip alternative for users who don't want a global mutation.
- **Version drift** — `cli.ts` hardcodes `0.1.0`; must single-source before releases or artifacts mislabel.
- **Safety gate** — creating GitHub Releases is outward-facing; the release step needs explicit user action/approval, not silent CI on every push.
- **SEA (if ever pursued)** — `--experimental`, per-OS signing/notarization, and eta/asset rerouting are the real cost centers; do not start without its own spec.

## Ready for Proposal

**Yes.** Recommend proposing change 0007 around **Option A** (tarball on Releases) + version single-sourcing +
docs/wiki quickstart, explicitly deferring the true-SEA binary (Option C) to a future change. The orchestrator
should confirm with the user that "prebuilt installable tarball (needs Node, which 0008 will auto-install)" is
acceptable as the meaning of "binary" for now — that's the one open expectation to align before `sdd-propose`.
