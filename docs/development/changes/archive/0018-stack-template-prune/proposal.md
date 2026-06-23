# Proposal — 0018 · Engineering-practices baseline (replace per-stack prose)

> Phase: propose. Builds on `explore.md` (Option D + Decisions D1–D3). Honors AGENTS.md guard-rails:
> ratchet principle, progressive disclosure, idempotency, byte-equivalent skill migrations, English-only
> AI-facing content.

## Why

The per-stack prose (`templates/{languages,frameworks,environments}/*/layer.md.eta` → `references/stack/<id>.md`)
restates ecosystem defaults a capable agent already follows, never covers the user's actual stack (12 bundled vs
a long tail on a thin fallback, `src/generate/references.ts:54-71`), and costs linear maintenance. That is value
in the wrong place. Concentrating it in **one rich, evergreen engineering-practices baseline**, and pushing
stack/project specifics to **skill packs**, is lighter, more honest, and matches the harness's own altitude
rules — while keeping the zero-config baseline that makes the product worth using.

## What

### In scope
- **Add** `references/engineering-practices.md` — a rich, opinionated, **language-agnostic** good-practice
  reference ("rules with teeth"), reached by a **lean pointer** from the AGENTS.md hub (0017 pattern). Carries
  the still-useful per-stack rules as **generic patterns** (e.g. "schema changes are reviewed, reversible
  migrations"; "never bake secrets into images/artifacts"; "validate external input at boundaries").
- **Remove** the 12 per-stack prose templates and their generated `references/stack/<id>.md` bodies. Keep a
  **one-line context7 pointer per active stack id** as the only stack-aware residue (D-clarify Q1; leaning keep).
- **Keep intact** every *functional* registry output: VS Code extension/formatter recs, `detect` seed,
  skill-pack gating, MCP/context7 wiring. Removing prose ≠ removing stack awareness.
- **Simplify the `init` wizard** to match: drop per-layer prose authoring; stack selection remains only to feed
  the functional outputs above.
- **Document** that stack/project-specific rules now live in **skill packs** (ours or a company's) — the
  intended, designed path, not a gap (`docs/project/EXTENDING.md` + `PROJECT-STATE.md`).
- Mechanical invariants: bump `TEMPLATES_VERSION` (`src/version.ts`), re-render (`sync` stays idempotent),
  re-hash the integrity manifest, update affected `test/` assertions.

### Out of scope (explicit)
- **Headless / programmatic install for an AI agent** (non-interactive `init` + chained `package`). Real and
  wanted, but transversal (touches `init`, `package`, CLI surface) and independent of the stack refactor →
  **its own change, 0019**. Recommended split; confirm below.
- No change to the **module registry catalog** (which stack ids exist), to MCP, or to the SDD methodology.
- No new bundled **company** packs; the extension contract is unchanged (we only document it as the path).
- No version bumps of project dependencies (Safety gate untouched).

## Approach

1. Author `references/engineering-practices.md` from a new template + the absorbed generic patterns; wire a lean
   pointer block into the AGENTS.md hub via `BLOCK_MANIFEST` / `composeBlocks` (mirror the 0017 stack-pointer
   mechanism in `src/generate/blockManifest.ts` + `references.ts`).
2. Strip the per-stack prose path: delete `templates/{languages,frameworks,environments}/*/layer.md.eta`, reduce
   `stackBody()`/`stackPointer()` to the one-line context7 pointer, keep functional registry use.
3. Trim the wizard prompts in `src/commands/init.ts` (+ `wizard.ts` defaults) accordingly.
4. Update docs (`EXTENDING.md`, `PROJECT-STATE.md`, `ARCHITECTURE.md` if the block graph changes), bump
   `TEMPLATES_VERSION`, re-render, re-hash manifest, fix tests. Verify idempotency + `doctor` green.

## Decisions to confirm
1. **Split headless-install into 0019** (recommended) vs. fold into 0018. *Recommend: split* — keeps one logical
   change per folder and an honest scope.
2. **Keep the one-line context7 pointer per stack id** vs. emit nothing stack-aware. *Recommend: keep.*
3. **Managed-block contract:** the removed per-stack blocks (`lang-*`, `fw-*`, `env-*` in `blockManifest.ts:62-72`)
   are a stable contract — removing ids could orphan content in users' repos. *Recommend:* treat as a documented
   migration (the blocks collapse into the new pointer); confirm we accept the regeneration churn for users.
4. **`engineering-practices.md` boundary with Layer-0 Universal conventions** — the exact rule set and where the
   lean hub ends. (Detailed in `clarify`.)

## Risks
- **Orphaned managed blocks in existing user repos** when `lang-*/fw-*/env-*` ids disappear (`writeManaged` never
  deletes unknown blocks). *Mitigation:* document the migration in the change + `MAINTAINING.md`; consider an
  `upgrade` note; keep the AGENTS.md hub heading stable so diffs are legible.
- **Perceived value loss** (new users no longer get "App Router by default" etc.). *Mitigation:* the baseline is
  visibly richer; the skill-pack path is documented; context7 pointer keeps version facts reachable.
- **Layer-0 duplication** in the new reference. *Mitigation:* clarify defines the boundary before the spec; hub
  stays lean, reference carries depth.
- **Test churn** across `generate.test.js` and any wizard/snapshot tests. *Mitigation:* update in lockstep;
  idempotency + `doctor` + `verify` are the acceptance gates.
