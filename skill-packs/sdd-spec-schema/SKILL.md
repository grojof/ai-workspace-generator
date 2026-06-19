---
name: sdd-spec-schema
description: >
  REASONS Canvas spec schema (8 sections + closed frontmatter, profiles A/B). Trigger: when authoring, reviewing or validating a spec in `sdd.schema: reasons` mode.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-spec-schema — REASONS Canvas

Closed specification schema for `sdd.schema: reasons` (auditable enterprise apps). The spec is the
single source of truth; code derives from it. Headings, frontmatter keys and enum values are English;
the body follows the project language.

### Frontmatter (closed — unknown keys are an error)
- Identity: `spec_id` (NNN), `title`, `slug`, `version` (vN), `schema_version: 2`.
- Lifecycle: `status` (draft | user-reviewed | it-approved | implemented | retired), `created`, `updated`.
- Ownership: `owner` (email), `reviewers` (list).
- Classification: `profile` (A | B), `language` (ca | es | en).
- Risk flags: `handles_personal_data`, `requires_external_api`, `requires_authentication`, `estimated_complexity` (S|M|L).
- Profile-A: `serves_html_ui`. Profile-B: `uses_localstorage`, `uses_npm_build`, `uses_react`, `runs_node_server`.
- UI: `apply_branding` (default true). Relations: `related_specs`, `tags`.

### Body — exactly these 8 H1 sections, in order, English headings
`0. Changelog` · `1. Requirements` · `2. Entities` · `3. Approach` · `4. Structure` · `5. Operations` · `6. Norms` · `7. Safeguards`.
(Body prose in the project language; headings stay English.)

### Hard rules
- Spec is the source of truth: correct the spec before the code.
- REASONS only: a spec without the 8 H1 headings is invalid.
- Every Operation (§5) has a `Maps to:` line citing ≥1 acceptance criterion (§1.5).
- Every external HTTP call declares an explicit timeout (blocking reviewer reject).
- `handles_personal_data: true` → §7.2 (legal basis, retention, rights, DPO) is mandatory.
- §1.4 Out of scope lists ≥1 explicit exclusion; §1.5 lists ≥3 Given/When/Then acceptance criteria.
- Profile B has no server-held secrets unless `runs_node_server: true`.

### Store & versioning
Stable specs in `{{paths.specs}}/{NNN}-{slug}.md`; in-flight work in `{{paths.changes}}/`. Versioning is **Git**
(history, PRs) — no `_vN` filename suffixes. Record status transitions in the spec's §0 Changelog.

### Lifecycle (`status`)
`draft → user-reviewed → it-approved → implemented → retired` (linear; a reopen/audit-failure steps back one).
Gates: `draft → user-reviewed` needs the §8 checklist green + non-empty `reviewers` (owner sign-off, no
version bump); `user-reviewed → it-approved` needs **all four `sdd-audit-*` green**. Code and tests are
generated only from `user-reviewed` or later. The `sdd-spec-review` skill drives every transition and refuses
any not in this chain (e.g. `draft → it-approved` directly).

### Load on demand
The full schema, worked examples and the controls catalogue (TECH/SEC/CONV) are an external
reference (supply your own; not bundled here) — load them only when authoring or auditing. This skill is the working summary.
