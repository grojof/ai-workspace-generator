# Proposal — F3: integrity manifest + `aiws-verify`

ADR 0003 **Part E** (integrity: detect · self-heal · confine · warn — not a lock). Builds on F1 (namespace +
provenance), F2a (authored packs are `aiws-*`), F2b (overlay `relation`). No network, no breaking reshape.

## Why
The output is plain files in the user's repo — we cannot *prevent* edits. We make base integrity
**verifiable**: a generated manifest records what we own and its fingerprint, and a verify gate recomputes it
to catch tampering, renamed/orphaned markers, in-region drift and unexpected deletions early (CI gate, non-zero
exit). This is also the provenance sink F2b's `relation` and F2c's external packs plug into, and the substrate
`aiws-reconcile` (F4) audits against.

## What (this change = F3a + F3b together — a manifest is useless without its verifier)

### The manifest — `.ai-workspace/manifest.json` (generated, committed)
Written as the **last** step of `generate` (after every other artifact), idempotent. One entry per base-owned
artifact:
- `path` (workspace-relative, `/`-separated)
- `source` — `aiws@<TEMPLATES_VERSION>` (provenance)
- `kind` — `managed` (file mixes our regions with user prose) or `file` (we own the whole file)
- `hash` — sha256. **For `managed`**: hash of the concatenated managed regions only (so user prose *outside*
  `aiws:*` markers is free to change). **For `file`**: hash of the whole content.
- `blocks` — for `managed`, the ordered `aiws:*` block ids present (detects renamed/orphaned/missing markers).

**Ownership classifier** (no writer refactor): `managed` = files carrying `ai-workspace:begin:aiws:` markers
(`AGENTS.md`, `CLAUDE.md` incl. per-repo, `.github/copilot-instructions.md`); `file` = artifacts under
`.claude/skills/aiws-*/`, `.claude/commands/aiws-*`, `.github/prompts/aiws-*`. User seeds (`writeIfMissing`:
living-doc seeds, `.editorconfig`, settings) and vendored/stack packs are **not** tracked — they are the user's.
The manifest excludes itself. Built from disk post-write; **skipped in dry-run** (`upgrade --check`).

### The verifier — `aiws-verify` (+ `doctor --strict`)
Reads the manifest, recomputes, and reports, exiting non-zero on any finding (CI gate):
- **drift** — `managed` region content or `file` content changed vs recorded hash.
- **markers** — a recorded `aiws:*` block id is missing / renamed (orphan), or block order changed.
- **deletion** — a manifest-listed path no longer exists.
- **stale** — `source` version differs from the current `TEMPLATES_VERSION` (suggests `ai-workspace upgrade`).
`doctor --strict` runs the same checks as part of `doctor` and propagates the non-zero exit.

## Decisions (from ADR Part E open questions)
- **Location/format:** `.ai-workspace/manifest.json`, **committed** (so CI verifies it). *(ADR default.)*
- **Self-heal** (`sync` restores canonical; `--check` warns) + **confinement** + **safetyGuard hook on base
  files** → **F3c**, a follow-up. This change ships detect (manifest + verify) only.

## Out of scope
F3c (self-heal / confine / hook), F2c (git packs), F4 (`aiws-reconcile`).

## Risks
- Hashing the whole managed file would false-flag legitimate user prose edits → mitigated by hashing only the
  `aiws:*` regions. New generated artifact ⇒ `TEMPLATES_VERSION` bump + byte/idempotency coverage.
