# Verify — Greenfield technology-selection directive (idempotent)

Verified against `npm run build` + `npm test` (75/75) + `ai-workspace doctor`.

| Req | Scenario | Result |
|-----|----------|--------|
| R1 | Greenfield, stackless config gets the directive | ✅ `tech-selection` block renders: clarify constraints → production target → 2-3 coherent options → recommend → **await decision** (Safety gate) → record in PROJECT-STATE.md + `ai-workspace add` |
| R2 | Greenfield gating | ✅ new test: `mode:new` + empty stack ⇒ present, right after `skill-routing`; `mode:existing` ⇒ absent; `mode:new` + a stack ⇒ absent |
| R2 | Fixed Layer-0 prefix unchanged | ✅ "core prefix" invariant green (block sits at index 9, after the pinned first nine) |
| R3 | Living-docs decision record | ✅ `PROJECT-STATE.md` bullet now includes "stack & production-target decision (what + why)" — applies to all projects |
| R4 | Terse-offer convention | ✅ new bullet under Token efficiency: offer "say **X** and I'll explain X" instead of dumping |
| R5 | Additive, idempotent | ✅ new stable id `tech-selection`; idempotency invariant green; order golden unchanged (gated out when a stack exists); byte-baseline fixtures regenerated for the 5 captured cases |
| — | doctor | ✅ 0 errors / 0 warnings |

## Notes
- `TEMPLATES_VERSION` bumped 0.32.0 → **0.34.0** (0.33.0 is taken by the in-flight change 0009; resolve the
  trivial `src/version.ts` conflict to the higher value if 0009 merges first).
- Fixture diff: greenfield cases (`minimal`, `learn`, `example-reasons-odoo`, `no-features`) gain the block;
  `example-fullstack` (has a stack) only gains the terse-offer + living-docs lines — confirming the gate.
- **Did not resync this repo's own `AGENTS.md`.** A full `sync` surfaced *pre-existing* drift unrelated to 0010
  (the `configure-workspace` skill-routing row and uncommitted generated guide files were already missing from
  the committed output). Folding that into 0010 would muddy the change; tracked as separate housekeeping.

## Status
**Ready to commit.** Archive after merge. Housekeeping follow-up: re-sync the repo's dogfooded artifacts on
main to clear the pre-existing `configure-workspace` drift.
