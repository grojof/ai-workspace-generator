---
name: aiws-sdd-spec-review
description: >
  Review and edit a REASONS spec and drive its status lifecycle (draft → user-reviewed → it-approved → implemented → retired) with sign-off gates. Trigger: revising a spec or signing it off.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## aiws-sdd-spec-review — revise a spec & drive the status lifecycle (REASONS mode)

The maintenance counterpart of `aiws-sdd-spec-capture`: every change to a saved spec, plus the **status
transitions**. Always show a `git diff` and ask before saving. Versioning is **Git** (history + PRs) — the
`frontmatter.version` + §0 Changelog stay as an informative trail; there are no `_vN` filenames or manual `archive/`.

### Locate & validate
Pick the active spec in `{{paths.specs}}/` (by `spec_id`; ask if several). Verify the frontmatter parses, the 8
H1 sections are present, and `status` is one of the five values. A corrupted spec is fixed first, never edited blindly.

### Edits
Classify: content edit · structural add (reuse `aiws-sdd-spec-capture`'s per-section questions) · removal
(cascade-check §2↔§5 references) · flag toggle (include/exclude §3.3 auth, §3.4 storage, §7.2 PD) · profile
promotion B→A (structural rewrite, re-run `aiws-sdd-onboarding`). Re-validate against `aiws-sdd-spec-schema` before
saving. Show the diff; on confirm, commit (a content change after `user-reviewed` bumps `version` + a §0 bullet).

### Status lifecycle (sign-off gates)
`draft → user-reviewed → it-approved → implemented → retired` (linear; reopen/fail steps back one).

| From → To | Gate | Effect |
|---|---|---|
| draft → user-reviewed | full `aiws-sdd-spec-schema` checklist green; `reviewers` non-empty; UI specs: mockup accepted | §0 sign-off bullet (`Reviewer: <email>`); **no version bump** |
| user-reviewed → draft | user reopens | bump `version`; §0 "reopened" |
| user-reviewed → it-approved | **all four `sdd-audit-*` green** (recorded) | §0 IT signature; status-only |
| it-approved → user-reviewed | any audit failure | §0 failure reason |
| it-approved → implemented | deployment (out of scope) | §0 deploy date |
| implemented → retired | explicit decision | §0 retire note |

Refuse any transition not in the table (e.g. `draft → it-approved` directly). Code/tests are generated only
from `user-reviewed` or later. Record each transition in `{{paths.changes}}/<change>/`. Spec keys/headings stay
English; only the conversation follows `config.language`.

### Does NOT
Bypass validation or the diff; trigger `it-approved` without the four green audits on record; regenerate code
(that is `aiws-sdd-code-maintenance`).
