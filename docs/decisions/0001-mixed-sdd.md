# ADR 0001 — Mixed SDD: borrow concepts from Spec-Kit and OpenSpec, depend on neither

- **Status:** Accepted
- **Date:** 2026-06-15
- **Deciders:** ai-workspace maintainers

## Context

ai-workspace generates a Spec-Driven Development (SDD) flow for downstream repos. Two upstream projects
solve adjacent parts of SDD well:

- **[Spec-Kit](https://github.com/github/spec-kit)** (GitHub) — strong at the *greenfield bootstrap*:
  a project **constitution** (principles) and a **clarify** step that de-risks a spec before planning.
  Ships a CLI (`specify`) and a `.specify/` workspace.
- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** (Fission-AI) — strong at *continuous evolution*:
  changes as **deltas** against a living spec **baseline**, then **archived**. Explicitly "built for
  brownfield, not just greenfield". Ships a CLI (`openspec`) and an `openspec/` layout.

We were asked to use *both*. Naively wiring both CLIs as runtime dependencies would mean two artifact
stores, two command families, two mental models, and a moving-target coupling to two external tools —
directly against this project's core values (lean AGENTS.md, "no commands to learn", token efficiency,
[the CLI never calls external tooling](../../AGENTS.md)).

## Decision

We adopt the **ideas**, not the **machinery**. The SDD flow is a single, in-house methodology:

1. **One store, one command family.** Artifacts are plain Markdown under `openspec/` (we reuse OpenSpec's
   *folder layout* as a convention) and the flow is exposed as `/sdd-*` commands. No `.specify/`, no
   external CLI is required or installed.
2. **Borrowed from Spec-Kit (bootstrap):** a `constitution.md` and a `/sdd-clarify` step.
3. **Borrowed from OpenSpec (steady state):** delta changes against a living `specs/` baseline, with
   `/sdd-archive` folding the delta back in.
4. **Gating is by `project.mode`, not "both always on":**
   - `mode: new` → seed the constitution once (Spec-Kit ramp), then evolve via deltas.
   - `mode: existing` → no constitution bootstrap; every new feature is a delta change (OpenSpec) against
     the current specs. A new feature inside an existing project is the **normal** case and is pure SDD/OpenSpec.

## Boundary (what we deliberately do NOT replicate)

- Their CLIs (`specify`, `openspec`), validators, and scripts.
- Spec-Kit's `.specify/` directory and `/speckit.*` command names.
- OpenSpec's `/opsx:*` command names and validation format.

If a future maintainer feels the urge to vendor any of the above "for completeness", re-read this ADR:
the cost is double ceremony and external coupling, which this decision exists to avoid.

## Consequences

- The maintenance surface is **3 concepts**, not two codebases — tracked in
  [SDD-UPSTREAM.md](../SDD-UPSTREAM.md) and refreshed by the `/sdd-upstream-check` maintenance command.
- Downstream repos get a lean SDD section in `AGENTS.md`; the upstream-tracking machinery lives only in
  this generator (it is not shipped to generated projects).
- If either upstream changes its *philosophy* (not its tooling), we reconcile our concepts and bump
  `TEMPLATES_VERSION`.
