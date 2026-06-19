---
name: sdd-spec-capture
description: >
  Guided conversational interview that turns plain-language needs into a valid REASONS spec (8 sections, closed frontmatter). Trigger: creating a new spec in `sdd.schema: reasons` mode.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-spec-capture — guided interview → REASONS spec

Turn a non-technical user's needs into a valid REASONS spec. Ask **one focused question at a time** in the
user's language (CA/ES/EN); headings/keys stay English (body in the project language). Re-entrant: persist
partial answers in the change-folder so a pause is safe. Schema reference: the `sdd-spec-schema` skill.

### Flow
1. Title + `slug` + `estimated_complexity` (S/M/L) + tags. Next `spec_id` = max(existing)+1, 3-digit.
2. Walk the **8 H1 sections in order** (Requirements → Entities → Approach → Structure → Operations →
   Norms → Safeguards, plus §0 Changelog). Auto-fill §3/§4/§6/§7 from the profile, flags and conventions;
   ask only what the flags imply (auth questions iff `requires_authentication`, §7.2 iff `handles_personal_data`).
3. **Hard gates:** §1.4 ≥1 explicit exclusion; §1.5 ≥3 Given/When/Then; every §5 Operation has a `Maps to:`
   citing ≥1 acceptance criterion; every external call declares an explicit timeout.
4. UI apps (`serves_html_ui` / Profile B UI): produce a static **HTML mockup** the user signs off on first.
5. Validate against the full `sdd-spec-schema` checklist before writing. Never save an invalid spec.

### Write
Write `{{paths.specs}}/<NNN>-<slug>.md` with `status: draft`, `version: v1`. Record the interview summary +
hard decisions in `{{paths.changes}}/<change>/`. Hand off to spec review (sign-off → `user-reviewed`).

### Does NOT
Generate code or tests; invent answers when a question is open (always ask); touch files outside the spec
store and change-folder.
