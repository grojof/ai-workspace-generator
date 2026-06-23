# Verify report — 0018 · Engineering-practices baseline (replace per-stack prose)

> Phase: verify. Walks every `spec.md` requirement, scenario and success criterion against the implementation,
> with evidence. **Verdict: PASS** — all requirements met, full suite green, invariants hold.

## Gate summary (evidence)

| Check | Result |
|-------|--------|
| `node --test` (full) | **125 / 125 pass**, 0 fail |
| `eslint .` · `tsc -p tsconfig.json` | clean · clean |
| `ai-workspace doctor` | **0 errors / 0 warnings** (budget ~5828/6000, no orphaned blocks, **no dangling refs**, no orphan docs) |
| `ai-workspace verify` | ✔ all base artifacts match the manifest |
| Idempotency (2nd `sync`) | **0 created / 0 updated / 82 unchanged** |

## Requirements

### ADDED — Engineering-practices baseline reference — **PASS**
- *Scenario: baseline generated and pointed to* — `references/engineering-practices.md` is generated and the
  AGENTS.md hub block `aiws:engineering-practices` links to it; re-run is byte-stable. **Evidence:**
  `stack-references.test.js` → "baseline is generated and pointed to from the hub" + "baseline is idempotent".
- *Scenario: no Layer-0 duplication* — the baseline restates **none** of the Layer-0 *Universal conventions*
  verbatim. **Evidence:** grep for the Layer-0 lines ("Conventional Commits", "Files are **UTF-8**", "Match the
  surrounding code", "Prefer early returns") against `templates/references/engineering-practices.md.eta` → all
  **absent**. The reference opens by explicitly scoping itself as the *depth*, not the stance.

### ADDED — Skill packs are the documented path — **PASS**
- *Scenario: extension path documented* — `docs/project/EXTENDING.md` ("Add a stack module" + "to ship
  opinionated rules… author a stack pack") and `docs/development/status/PROJECT-STATE.md` (0018 decision entry:
  "lo específico de stack/dominio → **skill packs / grupos**") both state skill packs/groups as the designed
  home. **Evidence:** the two edited docs.

### ADDED — Non-destructive migration of removed reference files — **PASS**
- *Scenario: sync never deletes user-side files* — generation only ever **writes**; there is **no** file-delete
  code in the generation path. **Evidence:** grep for `unlink`/`rmSync`/`rmdir` across `src/generate/` +
  `src/render/writer.ts` → **none**. Migration documented in `docs/project/MAINTAINING.md` ("Orphaned files from
  a removed generation path (0018)") + this change folder.

### MODIFIED — Per-stack AGENTS.md block content — **PASS**
- *Scenario: block is an inline context7 pointer* — `aiws:lang-typescript` renders heading + `> Query
  **context7** for \`typescript@latest\` best practices.`, with **no** link to `references/stack/typescript.md`
  and **no** inlined rules; `doctor`'s dangling-ref check is clean. **Evidence:** `stack-references.test.js` →
  "per-stack block is an inline context7 pointer…"; fixture `example-fullstack.md` `lang-typescript` block.
- *Scenario: block ids stay stable* — the `lang-*/fw-*/env-*` ids are unchanged. **Evidence:**
  `invariants.test.js` block-order golden + core-prefix golden (now include `aiws:engineering-practices`, the
  stack ids unchanged); `block-manifest.test.js` byte-identical fixtures.

### REMOVED — Per-stack prose templates and generated bodies — **PASS**
- *Scenario: no per-stack body is produced* — no `references/stack/<id>.md` is written; the 12 `layer.md.eta`
  are gone and `stackBody`/`generateStackReferences` deleted. **Evidence:** `templates/{languages,frameworks,
  environments}/` directories **removed**, `find templates -name layer.md.eta` → none; `registry.test.js` → "no
  language/framework/environment ships a per-stack layer template (0018)"; `stack-references.test.js` asserts no
  body file.

### REMOVED — Copilot per-stack instruction projection — **PASS**
- *Scenario: no per-stack Copilot instruction file* — TS + copilot target emits **no**
  `.github/instructions/typescript.instructions.md`. **Evidence:** `stack-references.test.js` → "no per-stack
  Copilot instruction is generated"; `generate.test.js` (0012c test) + `multi-repo.test.js` updated to assert
  the single-repo case emits none (per-**repo** 0005 `applyTo` unaffected).

## Success criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| SC-001 | Baseline exists, hub-pointed, no Layer-0 dup | **PASS** | baseline test + grep (no verbatim Layer-0) |
| SC-002 | Each stack block = heading + 1 context7 line; 0 bodies, 0 stack instructions | **PASS** | `stack-references.test.js` + fixtures |
| SC-003 | 12 templates + `stackBody`/`generateStackReferences` gone | **PASS** | dirs removed; `registry.test.js`; src grep clean |
| SC-004 | `sync` deletes no pre-existing file; migration documented | **PASS** | no delete code; `MAINTAINING.md` note |
| SC-005 | Invariants: 2nd sync 0/0; doctor 0/0; verify green; version bumped; manifest re-hashed; tests green | **PASS** | gate summary above; `TEMPLATES_VERSION` 0.53.0; manifest re-hashed |

## Gaps & follow-ups (out of scope, by design)
- **Wizard simplification** — deferred (clarify Q4); no `init.ts` change in 0018.
- **Headless / programmatic install + `package`** — change **0019**.
- **Selectable skill-group UX (Odoo-style)** — separate follow-up; only documented here.
- **T13 `doctor` advisory** for leftover `references/stack/*.md` — intentionally **skipped** (optional MAY);
  the MAINTAINING note + existing dangling/orphan checks already nudge the migration.

## Self-check (quality bar)
- [x] Every requirement and scenario checked, with evidence.
- [x] No requirement marked done without proof (tests / grep / fixtures / CLI gate).
- [x] Failures would be reported honestly — none found; follow-ups are scoped-out by design, not gaps.
