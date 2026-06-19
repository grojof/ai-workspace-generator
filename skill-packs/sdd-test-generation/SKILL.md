---
name: sdd-test-generation
description: >
  Generate the test suite from the spec's §5 Tests blocks — Profile A pytest (70% coverage, TECH-A-013) or Profile B smoke checklist. Trigger: after code generation.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-test-generation — spec §5 Tests → a real suite

Turn each operation's **Tests** block (§5) into concrete artifacts. Pattern reference: a
`PYTEST_PATTERNS.md` (external; supply your own, load on demand).

### Pre-flight
- Locate the active spec (`{{paths.specs}}/`); reject `draft`/`retired`.
- Require generated code to exist (Profile A: use-cases module; Profile B: ≥1 operation module). Else route
  to `sdd-code-generation`.
- Read the prior test record for incremental scope; mark recorded files CLEAN / HAND-EDITED / MISSING.

### Generate
- **Profile A:** pytest under `tests/{unit,integration,e2e}/` mapped from the test-name hints (route happy/
  error path, use-case unit, repository integration, lifecycle, external-client with `httpx.MockTransport`).
  Shared fixtures + a `[tool.coverage]` block at **fail_under = 70** (TECH-A-013); add only dev-deps used
  (`pytest`, `pytest-asyncio`, `coverage[toml]`). Verify with `pytest --collect-only`; roll back un-collectable files.
- **Profile B:** append a structured `<h2>`-per-operation checklist to `tests/smoke.test.html`; verify it parses.

### Boundaries
Does not execute tests, modify source, or invent assertions (provides scaffolding; the user fills unique
assertions). Record the run in `{{paths.changes}}/<change>/`. Hand off to `sdd-self-review`.
