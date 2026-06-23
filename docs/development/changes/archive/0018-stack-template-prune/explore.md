# Explore — 0018 · Stack template prune & scope

> Phase: explore (SDD). Read-only investigation + options. Origin: 2026-06-23 audit follow-up — user asked
> whether the per-layer stack templates (languages / frameworks / environments) are correct, lack context, or
> should be dropped in favor of company overlays. Direction chosen (Option D below): **replace the per-stack
> prose matrix with one rich, evergreen engineering-practices baseline; everything stack-/project-specific
> becomes the user's job via skill packs (ours or a company's).**

## Decisions taken (post-discussion)

- **D1 — Baseline home:** a referenced **`references/engineering-practices.md`** (rich, opinionated, evergreen,
  language-agnostic), reached by a **lean pointer** from the Layer-0/Layer-1 hub — same progressive-disclosure
  pattern as 0017. It must **not duplicate** AGENTS.md Layer-0 *Universal conventions* (Code style, Reviews &
  safety); those stay as the lean hub, the reference carries the deep "rules with teeth".
- **D2 — Decision-bearing per-stack rules:** keep it **as simple as possible** — absorb the still-useful ones as
  **generic patterns** in the baseline (e.g. "treat schema changes as reviewed, reversible migrations"; "never
  bake secrets into images"). Anything genuinely stack/project-specific is **not** shipped here: it belongs in a
  **skill pack** — added by us or by a company. Stack packs / company overlays are the extension point.
- **D3 — Scope additions (raised by the user):**
  - **Simplify the `init` wizard** to match: with per-stack prose gone, the wizard no longer authors per-layer
    rules. Stack selection stays only for its *functional* outputs (VS Code recs, detect seed, skill-pack
    gating, context7 pointer).
  - **Headless / programmatic setup for an AI agent:** ensure the whole workspace can be installed +
    **packaged** non-interactively via **one command that takes the values to define** (no prompts), so an agent
    can scaffold and `package` in a single shot. Today `init` is interactive (`@clack/prompts`); `--yes/--simple
    /--advanced/--from` exist but there is **no fully non-interactive, values-in path** (`src/commands/init.ts`,
    `src/cli.ts:28-43`).

## Problem (grounded in the code)

The per-layer stack content has two quality problems that the harness's own rules flag:

1. **Some bundled rules restate ecosystem defaults**, which violates AGENTS.md's *ratchet principle*
   ("every standing rule should trace to a real, observed failure"). Examples in the bundled `.eta`:
   - `templates/frameworks/react/layer.md.eta:4` — "Function components + hooks only. No class components."
   - `templates/languages/typescript/layer.md.eta` (→ `references/stack/typescript.md:3`) — "Strict mode on… no implicit `any`."
   - `templates/environments/docker/layer.md.eta` — "Pin base image tags (no bare `latest`)."
   These are things a capable agent (especially with **context7**) already does. The durable value of writing
   them down is that the standard becomes **pinned, git-reviewable, and identical across Claude/Copilot/Cursor**
   — but that argument only holds for rules encoding a *decision* (e.g. Next.js "App Router by default",
   TypeScript "named exports, no default exports for shared modules"), not for restating defaults.

2. **The bundled scope is implicit and the fallback is anemic.** `src/modules/registry.ts` marks 12 modules
   `bundled: true` (have a `layer.md.eta`) and leaves 10 registered-but-unbundled (`java`, `csharp`,
   `javascript`, `angular`, `express`, `nestjs`, `mysql`, `mongodb`, `linux`, `windows`). The split reflects
   what was authored, not a stated policy. Unbundled ids hit the generic fallback in
   `src/generate/references.ts:54-71`, which emits only 1–2 boilerplate lines + a context7 pointer — so a
   Java/Spring/Rust user gets a near-empty layer while a TS user gets a rich one. The experience is uneven and
   the gap is undocumented (it reads as an omission, not a designed long-tail path).

## Current reality

- **Two-tier rendering (from change 0017).** `stackPointer()` (`references.ts:75`) writes a thin pointer into
  AGENTS.md (`## <id> (Layer N…)` + `Rules → references/stack/<id>.md`); `stackBody()` (`references.ts:51`)
  writes the detail file from `templates/<category>/<id>/layer.md.eta`, or the fallback when no template exists.
- **Bundled templates (12):** `languages/{typescript,python,go}`, `frameworks/{react,nextjs,vue}`,
  `environments/{docker,postgres,odoo,python-venv,wsl,node-runtime}` — each a single `layer.md.eta`.
- **Evergreen / context7 split is already correct.** Every bundled file ends with a `> … query context7 for
  <id>@<version>` line and avoids version-specific facts. That split is sound and should be preserved.
- **Registry is the single source of selectable modules** (`specs/configuration.md:9`); `doctor` validates
  configured ids against it (`configuration.md:94`). The explore must not break that contract.
- **No existing spec requirement governs stack-layer *content quality* or *bundled scope*.** `configuration.md`
  covers the registry, detection, wizard, and composition — but not what a layer file must/should contain.
  This change adds that missing requirement (mostly ADDED, not MODIFIED).
- **Idempotency + byte-equivalence constraints apply.** Editing `.eta` content changes generated output, so
  `TEMPLATES_VERSION` (`src/version.ts`) must bump; `references/stack/*.md` regenerate via `sync`; the
  integrity manifest (`.ai-workspace/manifest.json`) re-hashes. Tests in `test/` assert generated content.

## Open questions

1. **Bundled-scope policy:** what is the *stated* criterion for shipping a `layer.md.eta`? Candidates:
   "stacks we dogfood / officially support" vs "most-common stacks" vs "keep the current 12, freeze the set".
   Who decides additions (java/angular/express are registered but unbundled — promote any now, or leave to the fallback)?
2. **How aggressive is the prune?** Drop only pure default-restatements, or also collapse multi-line rules into
   the context7 pointer? Is there a target like "≤ N decision-bearing bullets per layer"?
3. **Fallback richness:** keep it minimal (it correctly says "no bundled module — use context7") or give it a
   slightly richer skeleton (formatter/lint + boundary-validation + context7) so unbundled stacks aren't bare?
4. **Where is the scope policy documented** so the gap reads as designed? `docs/project/EXTENDING.md`,
   `PROJECT-STATE.md`, or a new note? Should `doctor`/`list` surface "bundled vs fallback" to set expectations?
5. **Test impact:** which assertions in `test/` pin the exact bundled wording, and will they need updating in lockstep with the prune?

## Options

### A — Prune content only (minimal)
Trim each bundled `.eta` to decision-bearing rules; leave registry/fallback untouched; document nothing new.
- **+** Smallest diff; directly applies the ratchet principle; trims tokens in `references/stack/*`.
- **−** Leaves the scope policy implicit and the coverage unevenness unaddressed (open questions 1, 3, 4 remain).

### B — Prune + formalize scope + enrich fallback (recommended)
Do A, **plus**: write the bundled-scope criterion into docs (and optionally surface it in `doctor`/`list`),
and give the fallback a slightly richer, useful skeleton so the long tail degrades gracefully *by design*.
- **+** Closes the real gap (uneven, undocumented coverage); makes "fallback = the long-tail path" explicit;
  one coherent story (baseline + company overlay + context7). Aligns with harness-engineering altitude.
- **−** Larger surface: touches templates, the fallback in `references.ts`, docs, and possibly `doctor` output;
  more tests to update; needs a `clarify` on the scope criterion and fallback richness.

### C — Remove built-in stack templates entirely
Delete the `.eta`s; rely on company overlays / custom skill-packs / context7 for *all* stack guidance.
- **+** Zero ongoing content maintenance.
- **−** Kills the zero-config baseline with no replacement; pushes *all* authoring onto every user; company
  overlays are for *org* rules, not a universal baseline. Too blunt — it removes value instead of relocating it.

### D — Replace the per-stack matrix with one rich engineering-practices baseline (recommended)
Reframes the value: instead of N×M×K thin per-stack files, ship **one robust, opinionated, evergreen
`references/engineering-practices.md`** (language-agnostic good-practice rules *with teeth*), referenced by a
lean pointer from the Layer-0/Layer-1 hub (same progressive-disclosure pattern as 0017). Then:
- **Remove the per-stack prose** (`templates/{languages,frameworks,environments}/*/layer.md.eta` → the 12
  `references/stack/<id>.md`). This is the content that restates defaults and never covers the user's real stack.
- **Keep everything *functional* the registry drives** — VS Code extension/formatter recs, `detect`, skill-pack
  gating, and a **one-line context7 pointer** per active stack id (so version-specific facts stay reachable).
  Removing prose ≠ removing stack awareness.
- **Project/stack specifics become the user's job by design** — company overlay or a custom skill — and this is
  documented as the intended path (not a gap).
- **+** Concentrates value where the harness genuinely adds it (pinned, git-reviewable craft standard that
  doesn't rot); kills the uneven-coverage and maintenance problems at the root; **substantially lighter** tree
  and token footprint; one coherent story (universal baseline + user/company specifics + context7 versions).
- **−** Loses the few *decision-bearing* per-stack rules (e.g. Next.js "App Router by default", Postgres "schema
  changes via migrations"); those must relocate to the user's company/skill layer or be absorbed as generic
  patterns. Larger refactor: touches templates, `references.ts`, the registry's prose path, docs, and tests.
- **Risk to resolve:** the new baseline must **not duplicate** the existing AGENTS.md Layer-0 *Universal
  conventions* (Code style, Reviews & safety). Decide whether it *expands* Layer 0 or lives as a referenced
  `references/engineering-practices.md` pointed to from a lean hub (the latter fits the 0017 pattern).

## Recommendation

**Option D** (supersedes the pre-explore lean toward B). The grounded problems — boilerplate at the wrong
altitude *and* implicit, uneven, costly per-stack coverage — are *structural*, so the structural fix beats
pruning 12 files line by line. Keep the evergreen/context7 split and all functional registry outputs; replace
the per-stack prose with one rich engineering-practices reference; make "user owns the project/stack specifics"
the documented, designed path.

**Resolved (see Decisions taken):** D1 settles the baseline home (referenced `engineering-practices.md`, no Layer-0
duplication); D2 settles the per-stack rules (absorb the useful ones as generic patterns; the rest → skill packs).

Carry into `clarify` before the spec:
1. **Per-stack residue:** keep a **one-line context7 pointer** per active stack id (cheap, keeps version facts
   reachable), or emit nothing per stack? (Leaning: keep the pointer; it's the only stack-aware text left.)
2. **`engineering-practices.md` contents & boundary:** the concrete rule set, and the exact line where Layer-0
   *Universal conventions* ends and the deep reference begins (avoid overlap, keep the hub lean).
3. **Wizard simplification shape:** which prompts are removed/kept once per-stack prose is gone; does `detect`
   stay the stack seed; any change to Simple vs Advanced paths.
4. **Headless install API (scope-split candidate):** the shape of the non-interactive path — `init --config
   <file>` / stdin JSON / a full flag set — and whether `package` is chained. **This may warrant its own change
   (0019)** to keep 0018 focused on the stack/baseline refactor; decide in `propose`.
5. **Test + version impact:** `TEMPLATES_VERSION` bump (`src/version.ts`), manifest re-hash
   (`.ai-workspace/manifest.json`), and which `test/` assertions pin the removed per-stack wording / wizard prompts.
