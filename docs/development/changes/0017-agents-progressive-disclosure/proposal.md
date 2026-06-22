# Proposal: 0017 — AGENTS.md as a lean governance hub + cross-target references

## Intent

Turn AGENTS.md from a monolith into a **complete Layer-0 governance hub** that **points to** its situational
detail, which loads by trigger in each target's *native* mechanism — so the spine stays lean and the parts stay
clean and contextual. One canonical source per part; each target gets a projection (the project's existing
"one source, many adapters" model, applied to the spine itself).

## The dividing line (non-negotiable)

- **Inline forever (governance):** `header`, `core`, `profile`, `versioning`, `safety`, `workflow`, and the
  intent-`routing` table. These are "always apply" — an agent must obey them without opening anything. ~2.2k tokens.
- **Movable (situational detail):** `lang-*`/`fw-*`/`env-*` (path-triggered), and `sdd` / `harness-engineering`
  / `living-docs` (task-triggered, whose substance **already lives in the `aiws-*` skills** after 0012a).

## The reference substrate (the key idea)

A movable part has **one canonical markdown** generated from a template; AGENTS.md keeps a **one-line pointer
with its trigger**; each target receives the same content through its native loader:

| Target | How the reference reaches it |
|--------|------------------------------|
| **Copilot** | a generated `.github/instructions/<id>.instructions.md` with `applyTo` glob — auto-loaded by path (already the mechanism at `index.ts:208`) |
| **Claude / opencode** | the existing **skill** (task parts) or the agent follows the AGENTS.md pointer to read the reference (path parts) |
| **Codex** | the agent follows the AGENTS.md pointer; optionally a nested `AGENTS.md` for path parts |

All projections are **generated from the same template** → idempotent, no hand-duplication, no cross-target
drift. The pointer keeps every skill-less target self-sufficient.

## Scope — two phases

### 0017a — Stack detail via `applyTo` + references (contained, proves the substrate)
- Move `lang-*`/`fw-*`/`env-*` block bodies to a canonical `references/stack/<id>.md` (generated).
- AGENTS.md keeps a compact **stack pointer table**: `TypeScript → references/stack/typescript.md · applies to **/*.ts`.
- When `copilot` is a target, project each into `.github/instructions/<id>.instructions.md` (`applyTo` glob) so
  Copilot auto-loads it by path.
- Net: ~330+ tokens out of the spine here; for stack-heavy repos, much more (every language/framework/env).

### 0017b — Task detail de-duplicated against skills
- `sdd`: shrink the AGENTS.md block to the **lifecycle diagram + a 3-line orchestrator + pointer** to the
  `aiws-sdd-*` skills / `references/sdd.md`. The full methodology already lives in the skills (0012a) — today
  the block partly **duplicates** it (~492 tokens).
- `harness-engineering`, `living-docs`: same shape — keep a 2-line stance + pointer; detail to `references/`
  (and the existing `aiws-living-docs` skill).
- Keep `skill-routing` (skill-less targets need it); see open question Q2.

## Affected areas

| Area | Impact |
|------|--------|
| `src/generate/blockManifest.ts` + `templates/` | block bodies → pointers; new reference renderers |
| `src/generate/` (new `references.ts`) | emit `references/<area>/<id>.md` + the Copilot `.instructions.md` projection |
| `src/generate/index.ts` | wire references into the artifact set + manifest |
| `test/__fixtures__/agents/*.md` + byte fixtures | regenerate deliberately; `TEMPLATES_VERSION` bump |
| `docs/project/ARCHITECTURE.md` | document the hub + reference substrate |
| `doctor` | a check that every AGENTS.md pointer resolves (reuse 0016a's dangling-ref machinery) |

## Recommendation

**0017a first** (low-risk, leverages `applyTo` that already exists, proves the one-source/many-projections
substrate), then **0017b** (the bigger token win, mostly de-duplication against skills). **Layer-0 stays
inline.** This is the deliberate move to the right architecture — not budget-reactive.

> Note: for *this* repo, ~1858 tokens are the **manual contributor guide** outside the markers (not generated).
> 0017 won't shrink that; if this repo wants headroom, that guide could move to `docs/project/` separately (Q3).

## Open questions (for clarify)

- **Q1 — Canonical location:** neutral `references/<area>/<id>.md` (target-agnostic, Copilot gets a generated
  projection) **vs** make `.github/instructions/<id>.instructions.md` the canonical home (Copilot-native, less
  duplication but Copilot-centric). *Recommendation: neutral `references/` + generated projections.*
- **Q2 — `skill-routing` on Claude:** keep it always (simple) **vs** emit it only when a skill-less target
  (copilot/codex) is present, since Claude/opencode skills self-advertise. *Recommendation: keep always for now;
  revisit if the spine is still heavy.*
- **Q3 — This repo's contributor guide (1858 tokens):** out of scope (repo-only) **vs** fold into `docs/project/`
  with a pointer as a follow-up. *Recommendation: out of scope for the generator change; optional repo cleanup.*
- **Q4 — Codex nested AGENTS.md:** worth generating per-path nested AGENTS.md for stack rules, or is the
  pointer-read enough? *Recommendation: pointer-read first; nested AGENTS.md only if it proves needed.*
