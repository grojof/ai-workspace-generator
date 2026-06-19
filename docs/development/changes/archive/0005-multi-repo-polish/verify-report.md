# Verify report — Multi-repo polish

Verified against `spec.md` (R1–R3). Status: **PASS**. `npm run build` clean; `npm test` **71/71** (67 + 4
new). `TEMPLATES_VERSION` 0.30.0 → 0.31.0.

| Req | Verdict | Evidence |
|-----|---------|----------|
| **R1** Copilot per-repo `applyTo` | ✅ | `generateWorkspace` loops child repos → `.github/instructions/<slug>.instructions.md` with `applyTo: "<path>/**"`; single-repo emits none (`multi-repo.test.js`). |
| **R2** Registry single-source + doctor | ✅ | `ModuleEntry.vscodeExtensions`/`vscodeFormatter`; `guides.ts` derives `.vscode/*` from the registry (byte-identical order/dedup — existing tests green; new test asserts go/python output); `doctor` warns on unknown stack ids (`generate.test.js`); `add`/`remove` help lists `environment`. |
| **R3** Optional one-plugin-per-repo | ✅ | `distribution.perRepo` (default false); `package` emits `plugins/<plugin>-<repo>/` per child + multi-plugin marketplace when true; default umbrella unchanged (`generate.test.js`). |

## Single-repo / default safety
- AGENTS.md goldens unchanged (`block-manifest.test.js`); `.vscode/*` derive from the registry but reproduce
  today's order/dedup (the existing single-repo package + generate tests stay green).
- `distribution.perRepo` defaults `false` → the umbrella `package` path is the existing code, untouched; the
  org zips + `INSTALL.md` are always the full aggregate.

## Notes / accepted deltas
- `TEMPLATES_VERSION` bumped: multi-repo generation now adds per-repo Copilot instructions (new output);
  single-repo output is unchanged.
- The Python VS Code formatter remains `charliermarsh.ruff` while the recommended extension is
  `ms-python.python` (reproduced as-is from the prior hardcoded map; not "fixed" to avoid output drift).
- De-hardcoding the Node/ESLint global settings block (TS/JS) is left as-is (it is not per-language catalog
  data); only per-language extensions/formatters moved to the registry.
