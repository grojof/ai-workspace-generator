# Proposal: Greenfield technology-selection directive (idempotent)

## Intent

Starting a new project with no stack is the highest-leverage moment of a workspace, yet nothing stops the AI
from picking the first technology it thinks of. We need a **standing, idempotent directive**: explore coherent
options across language/framework/environment **and the production target**, with trade-offs and a
recommendation, then **await the user's decision** — and record that decision (stack + dev env + prod target +
rationale) in the project's living docs. Plus a **terse-offer** convention to avoid output bloat.

## Scope

### In Scope
- **New managed block** `tech-selection` — `templates/core/tech-selection.md.eta` + entry in `BLOCK_MANIFEST`, **gated to greenfield** (`mode === "new"` or empty stack). Directive: present 2-3 coherent stack options + a production target, each with pros/cons/risk + a recommendation; await the choice; never default silently.
- **Decision record** in living docs: a **"Stack & production target decision"** section in `PROJECT-STATE.md` (`templates/living-docs/section.md.eta`), for **new and existing** projects (complete context).
- **Terse-offer convention** (one line in `core/conventions.md.eta`): offer "say X and I'll explain X" instead of long unsolicited explanations.
- Bump `TEMPLATES_VERSION`; update `test/invariants.test.js` (block order).

### Out of Scope
- A loadable skill (rejected — must be *always present*).
- Auto-selecting any stack without the user's decision.

## Approach

Additive managed block (new stable id) at the right altitude, gated to greenfield so existing repos aren't
nagged; living-docs template gains a decision record; conventions gain one terse-offer line. Pure
template/registration change — no generator runtime logic beyond manifest registration.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `templates/core/tech-selection.md.eta` | New | the directive |
| `src/generate/blockManifest.ts` | Modified | register block (greenfield gate) |
| `templates/living-docs/section.md.eta` | Modified | stack & prod-target decision record |
| `templates/core/conventions.md.eta` | Modified | terse-offer line |
| `src/version.ts`, `test/invariants.test.js` | Modified | bump + order contract |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Permanent block id (contract) | — | Additive; never rename/remove later |
| Token budget growth | Med | Keep block lean; `doctor` lints budgets |
| Nagging existing repos | Low | Gate block to greenfield; decision-record stays for all |

## Rollback Plan

Revert the commit: remove the block entry + template + conventions/living-docs edits + version bump. Generated
output returns to prior managed blocks (text outside markers is untouched).

## Dependencies

- None (parallel to the others).

## Success Criteria

- [ ] New-project AGENTS.md carries the always-present tech-selection directive (options + prod target + await decision).
- [ ] `PROJECT-STATE.md` records the chosen stack, dev env, production target, and rationale.
- [ ] Conventions include the terse-offer rule.
- [ ] Idempotency holds; `doctor` green; `npm test` (incl. invariants) green.
