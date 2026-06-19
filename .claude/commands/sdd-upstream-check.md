---
description: Reconcile our mixed SDD methodology with upstream Spec-Kit and OpenSpec philosophy changes.
---

# /sdd-upstream-check

Maintenance command for **this generator repo** (not for generated projects). It keeps our borrowed SDD
*concepts* aligned with their upstreams without depending on their tooling. See
[docs/decisions/0001-mixed-sdd.md](../../docs/project/decisions/0001-mixed-sdd.md) and
[docs/SDD-UPSTREAM.md](../../docs/project/SDD-UPSTREAM.md).

## Do this

1. **Read the tracker.** Open [docs/project/SDD-UPSTREAM.md](../../docs/project/SDD-UPSTREAM.md). Note the two upstreams,
   their repos, and the **Last reviewed** dates.
2. **Fetch upstream changes** since those dates (WebFetch the releases pages and READMEs):
   - Spec-Kit — https://github.com/github/spec-kit/releases and its README.
   - OpenSpec — https://github.com/Fission-AI/OpenSpec/releases and its README.
3. **Filter to philosophy only.** Keep changes to the *workflow/concepts*: a new lifecycle stage, a
   renamed or redefined principle, a changed bootstrap/clarify/delta/archive idea. **Ignore** CLI flags,
   packaging, `.specify/` / `/speckit.*` / `/opsx:*` tooling — by [ADR 0001](../../docs/project/decisions/0001-mixed-sdd.md)
   those never reach us.
4. **Propose, don't auto-apply.** For each relevant change, draft the concrete edit to our concept
   implementation:
   - phases/labels → [`src/i18n/strings.ts`](../../src/i18n/strings.ts)
   - seeds + gating → [`src/generate/sdd.ts`](../../src/generate/sdd.ts)
   - lifecycle/diagram → [`templates/sdd/orchestrator.md.eta`](../../templates/sdd/orchestrator.md.eta) (+ `templates/i18n/es/…`)
   - routing → [`templates/core/routing.md.eta`](../../templates/core/routing.md.eta) (+ es)
   Update the provenance table and **Last reviewed** dates in
   [docs/project/SDD-UPSTREAM.md](../../docs/project/SDD-UPSTREAM.md).
5. **If nothing philosophy-relevant changed:** just bump the **Last reviewed** dates and say so. No code edit.
6. **If you did change generated output:** bump `TEMPLATES_VERSION` in [`src/version.ts`](../../src/version.ts),
   run `npm run build`, and verify the idempotency invariants in [docs/project/MAINTAINING.md](../../docs/project/MAINTAINING.md).

Keep the replicated surface tiny: concepts, not a fork. Surface anything that smells like vendoring
machinery and stop for a human decision instead of adding it.
