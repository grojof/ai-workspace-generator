# Company overlay (Layer 4) — optional extension point

This repo is **shared-tools-first**: by default `company: none` and nothing here is emitted. The
organization overlay lets a team layer its **culture + working rules** on top of the generic workspace,
without forking the engine.

## How it works

- `overlay.md.eta` — the **base** company block, always rendered. It surfaces the conventions you set in
  `workspace.config.yaml` (`conventions.fileNaming`, `prefixes`, `banned`, `notes`).
- `<company>/overlay.md.eta` — a **per-organization** culture block, rendered only when `company` is set
  to that org (e.g. `company: example`). `example/` is a ready-to-copy placeholder.

## Add your own organization (≈3 steps)

1. Copy `example/` to `templates/company/<your-org>/` and rewrite `overlay.md.eta` with your real
   culture/rules (keep it compact, English — it is consumed by the AI).
2. Add `"<your-org>"` to the `company` enum in `src/config/schema.ts` (and the display name in
   `src/generate/packaging.ts` `ORG_NAME` if you publish a plugin).
3. (Optional) Ship business skills as `skill-packs/corp-*` gated by `company` — see
   `docs/project/EXTENDING.md`.

No real company data lives in this public repo by design.
