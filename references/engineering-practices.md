# Engineering practices — the craft baseline

> Reached by a pointer from the AGENTS.md hub (progressive disclosure). Layer-0 *Universal conventions* state
> the **stance** (commits, code style, "validate inputs", "handle errors", "never commit secrets"); this file
> is the **depth** — concrete, language-agnostic, decision-bearing practices. It does not repeat Layer-0.
> Stack- and project-specific rules are **not** here by design — they live in **skill packs / skill groups**
> (ours or your organization's). For version-pinned API facts, query **context7**, never guess.

## Change discipline
- Make the change **small and reversible**. One logical change at a time; if a refactor is needed to land a
  feature cleanly, do the refactor as its own step first.
- Keep the working tree releasable. Don't leave a half-migrated state behind a green build.
- When the safe path is unclear (more than one plausible outcome), **stop and surface options** — do not pick
  silently. Hard-to-reverse or outward-facing actions need explicit confirmation.

## Data & migrations
- Treat every schema/data change as a **reviewed, reversible migration**: forward + rollback, tested on a copy
  before production.
- **Never** edit production data by hand as a fix; encode it as a migration so it is repeatable and auditable.
- Make migrations **idempotent and ordered**; a re-run must not corrupt or double-apply.
- Back up (or snapshot) before a destructive or irreversible step; know the restore path before you start.

## Secrets & supply chain
- Secrets come from the environment / a secret manager — **never** baked into source, images, artifacts, logs,
  or fixtures. A leaked secret is rotated, not just removed from the diff.
- **Justify every new dependency**: prefer the standard library and what's already vendored; weigh
  maintenance, license, and transitive cost. Flag unmaintained or vulnerable packages.
- Pin and verify what you pull (lockfiles, integrity hashes). Don't bump versions as a side effect of an
  unrelated task — a version change is a deliberate, assessed decision.

## Input & boundaries
- **Parse, don't validate**: at every trust boundary (network, CLI, files, env, IPC), turn untrusted input
  into a typed, validated value with a schema — then trust the type, not the raw input.
- **Fail closed.** Reject the unexpected by default; allow-list rather than deny-list.
- Preserve escaping/encoding end-to-end (SQL, shell, HTML, paths). Never assemble these by string concatenation
  from untrusted parts.
- Keep boundaries thin: validate once at the edge, pass clean values inward.

## Error handling & failure
- Handle errors **explicitly and where you can act**. No silent catches; an empty `catch` that swallows is a bug.
- Fail with **context** (what was attempted, with which inputs) — but never leak secrets or PII in the message.
- Distinguish **expected** outcomes (model them in the return/result type) from **bugs** (let them surface).
- Make external calls defensive: timeouts, bounded retries with backoff, and a defined behavior when the
  dependency is down. No unbounded waits.

## Testing
- Test **behavior, not implementation** — assert on the contract so refactors don't break the suite.
- A bug fix starts with a **failing test that reproduces it**; the fix makes it pass.
- Cover the **edges**: empty, boundary, malformed, concurrent, and the unhappy paths — not just the happy one.
- Keep tests **deterministic and isolated** (no shared mutable state, no real clock/network/random unless
  pinned). A flaky test is treated as a failing test.

## Observability
- Log at boundaries and decisions, **structured** and at the right level; logs are for diagnosis, not chatter.
- No leftover debug logging in committed code. Never log secrets, tokens, or PII.
- Make failures **traceable**: enough context (ids, operation) to reconstruct what happened without a debugger.

## Performance
- **Measure before optimizing.** Profile to find the real hot path; don't trade clarity for speed on a guess.
- Mind algorithmic cost (avoid accidental O(n²), N+1 queries, work inside hot loops) — that's design, not
  micro-tuning.
- Optimize only with a number that proves it mattered; keep the readable version unless the data says otherwise.
