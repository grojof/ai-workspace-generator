# Tasks — F3: integrity manifest + `aiws-verify` (0015)

## F3a/F3b — manifest + verify (done; shipped together — a manifest is useless without its verifier)
- [x] `src/generate/manifest.ts`: `.ai-workspace/manifest.json` (path · source@version · kind · hash · blocks).
      `managed` files hash only their `aiws:*` regions (user prose outside markers stays free); `file` artifacts
      (`.claude/skills/aiws-*`, `commands/aiws-*`, `prompts/aiws-*`) hash whole. Excludes itself; skipped in dry-run.
- [x] Wired as the **last** step of `generate` (`index.ts`) + i18n `desc.manifest` (EN/ES). Idempotent.
- [x] `src/commands/verify.ts`: `verify()` (pure) + `runVerify()` (CLI). Findings: deletion / in-band drift /
      removed-or-renamed marker / unexpected block / order change (errors), stale source (warn). Non-zero exit on error.
- [x] CLI: `ai-workspace verify` + `doctor --strict` (runs verify after lint).
- [x] `test/integrity.test.js` (5): manifest written + clean + idempotent; in-band drift flagged; out-of-band
      prose safe (no false positive); removed marker flagged; owned-file edit + deletion flagged. 93/93 green.
- [x] Docs: USAGE (`verify` / `doctor --strict`) + MAINTAINING (manifest section). `TEMPLATES_VERSION` → 0.39.0.

## Deferred
- **F3c** — self-heal (`sync --check` warns before overwrite) + confinement + extend the `safetyGuard`
  PreToolUse hook to warn/block edits to manifest-listed base files (Claude Code only).
- **F2c** — git company packs + `company` → object + runtime reserved-namespace guard with teeth.
- **F4** — `aiws-reconcile` (base ↔ org overlay, propose-and-review), auditing against this manifest + relations.
