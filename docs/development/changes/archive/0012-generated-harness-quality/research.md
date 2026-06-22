# Research — Generated harness & SDD-skill quality overhaul

> Status: **exploration / research** (read-only). Gathering authoritative primary-source material before
> proposing a large change. Goal: make what this generator **emits** (SDD skills, commands, adapters) actually
> honour the philosophy it preaches (harness engineering, progressive disclosure, right altitude), aligned with
> the current best practices of Spec-Kit, OpenSpec, Agent Skills, and each target agent.

## 0. Why this change

The generator's own audit (see the findings table in the conversation / `0012` proposal) showed that the
**generated** SDD phase skills are thin, duplicated across command+skill, have circular triggers, and offer no
progressive disclosure — i.e. the tool that teaches harness engineering ships an under-engineered harness.
This document collects the external best practices needed to fix that *properly and deeply*, not just patch the
symptoms.

---

## 1. Spec-Kit (github/spec-kit) — what to adopt

**Philosophy.** Specifications are the **primary artifact**; "specifications don't serve code — code serves
specifications." Intent-driven; code is the last mile. ([spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md))

**Constitution.** `memory/constitution.md` = immutable, numbered **principles** (articles) that every spec/plan
must honour (test-first, simplicity, anti-abstraction, integration-first). Amendments need rationale + approval.

**Commands (sequential):** `/specify` → `/clarify` → `/plan` → `/tasks` → `/analyze` → `/implement`.
- `/clarify` reads the spec and surfaces ambiguities/edge cases **before** planning.
- `/analyze` is **read-only**: cross-checks all artifacts for inconsistencies, contradictions, coverage gaps.

**Spec template structure** (verbatim outline — [spec-template.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md)):
- **User Scenarios & Testing** (mandatory): user stories with **Priority (P1/P2/P3)**, "Why this priority",
  "**Independent Test**", **Acceptance Scenarios** in **Given/When/Then**, Edge Cases.
- **Requirements** (mandatory): Functional Requirements `FR-001…`, **`[NEEDS CLARIFICATION: …]`** markers,
  Key Entities.
- **Success Criteria** (mandatory): **measurable** outcomes `SC-001…`.
- **Assumptions**.

**Plan template:** "Phase −1 gates" (simplicity / anti-abstraction / integration-first), data models, contracts,
Complexity Tracking (justify exceptions). **Tasks template:** concrete tasks, `[P]` = parallelizable.

**Key transferable ideas:** clarification gates with explicit `[NEEDS CLARIFICATION]`; a read-only `analyze`
consistency pass; priorities + measurable success criteria; templates as guardrails that prevent premature HOW.

---

## 2. OpenSpec (Fission-AI/OpenSpec) — what to adopt

**Principles:** *fluid* (no phase gates), *iterative*, *easy* (minimal ceremony), **brownfield-first**.
([concepts.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md))

**Structure:** `specs/<domain>/spec.md` (current truth, **by domain**) vs `changes/<name>/` (proposal.md,
design.md, tasks.md, and **`specs/` delta specs**) → `changes/archive/<date-name>/`.

**Delta specs — the core mechanism** (we don't do this yet):
```markdown
## ADDED Requirements
### Requirement: <Name>
#### Scenario: <name>
- GIVEN … WHEN … THEN … AND …

## MODIFIED Requirements
### Requirement: <Name>            (Previously: <old behaviour>)

## REMOVED Requirements
### Requirement: <Name>            (Reason: …)
```
- **RFC 2119** keywords: MUST/SHALL, SHOULD, MAY.
- Requirement/Scenario heading convention (`### Requirement:` / `#### Scenario:`).

**Archive merge rules:** ADDED → append to main spec; MODIFIED → replace; REMOVED → delete; then move the change
folder to `archive/<date-name>/` preserving full context.

**Key transferable ideas:** the **delta-spec format** (ADDED/MODIFIED/REMOVED) is exactly what hardens our
`spec.md` + archive flow; domain-organized `specs/`; deterministic merge rules for archiving.

> We already document a **mixed** SDD (Spec-Kit constitution+clarify, OpenSpec deltas+archive) in
> `docs/project/decisions/0001-mixed-sdd.md`. This research **validates** that and gives the concrete formats we
> were missing (delta markers, requirement/scenario headings, NEEDS CLARIFICATION, success criteria).

---

## 3. Agent Skills best practices (Anthropic) — the rulebook

Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices),
[Equipping agents for the real world](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills).

**Frontmatter / triggering (critical):**
- `description` ≤ 1024 chars, **third person**, states **what it does AND when to use it**, with **specific key
  terms/triggers** from user intent. *Good:* "Generate commit messages by analyzing git diffs. Use when the
  user asks for help writing commit messages or reviewing staged changes." *Bad / vague:* "Helps with docs."
- `name` ≤ 64 chars, lowercase-hyphen, no `claude`/`anthropic`; prefer **gerund** (`processing-pdfs`) or noun
  phrase; avoid `helper`/`utils`.

**Conciseness:** the model is already smart — only add what it doesn't know. Smallest high-signal token set.

**Degrees of freedom** (match specificity to fragility): high (text heuristics) / medium (template + params) /
low (exact script). *SDD phases are medium-freedom → give a template + checklist, not a one-liner and not a rigid
script.*

**Progressive disclosure:**
- Keep **SKILL.md body < 500 lines**; split into **`references/*.md`** loaded on demand.
- **References one level deep** from SKILL.md (deeper → partial reads).
- ToC at the top of any reference > 100 lines.
- Bundle scripts (executed, not loaded); domain-split references.

**Structure patterns:** workflows as **numbered steps + a copy-able checklist**; **template** for output format;
**examples** (input/output pairs); **feedback loops** (validate → fix → repeat).

**Evaluation-driven:** build 3 evals **before** writing docs; baseline without the skill; iterate (Claude A
authors, Claude B uses, observe). "Evaluations are your source of truth for measuring Skill effectiveness."

**Anti-patterns:** forward slashes only; don't offer many options without a default; no time-sensitive info
(use an "old patterns" `<details>`); consistent terminology.

---

## 4. Context engineering / harness (Anthropic) — the philosophy, sharpened

Source: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

- **Right altitude:** "specific enough to guide behaviour effectively, yet flexible enough to provide the model
  with strong heuristics." Avoid both **brittle hardcoding** and **vague high-level** guidance. → our thin SDD
  skills sit at the *vague* extreme (no concrete signals: no sections, no quality bar).
- **Context is finite:** find "the smallest possible set of high-signal tokens"; beware **context rot**.
- **Just-in-time / progressive disclosure:** keep lightweight identifiers (paths), load detail at runtime. →
  argues for SKILL.md = overview + `references/` loaded on demand.
- **Tools/skills must be unambiguous:** "If a human engineer can't definitively say which tool should be used,
  an AI agent can't be expected to do better." → our **command vs skill duplication** directly violates this.
- **Prompt structure:** distinct sections (`<background>`, `## Instructions`, `## Output`), Markdown/XML headers,
  a few **canonical examples** over exhaustive edge cases.

This is the same creed the repo's own `harness-engineering` block states — the research just gives us the
external, authoritative phrasing and the concrete rules to *actually meet it*.

---

## 5. Per-agent customization — current best practices

| Agent | Reads natively | Customization surface | Implication for us |
|-------|----------------|------------------------|--------------------|
| **Claude Code** | `CLAUDE.md` (imports `@AGENTS.md`) | `.claude/skills/<name>/SKILL.md` (Agent Skills spec), `.claude/commands/*.md`, `.mcp.json`, settings | Skills must follow §3 rules; commands are thin launchers |
| **GitHub Copilot** | **`AGENTS.md` (root = primary)** + `.github/copilot-instructions.md` (if both exist, **both are used**); `.github/instructions/**/*.instructions.md` (`applyTo`); `.github/prompts/*.prompt.md` | New (Nov 2025): agent-specific instructions, `excludeAgent`; code-review uses instructions | **Finding:** Copilot now reads `AGENTS.md` natively → our full `.github/copilot-instructions.md` mirror likely **double-loads** content. Reconsider: slim it to a pointer, or keep only path-scoped `instructions/*` + prompts. ([GitHub Docs](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)) |
| **OpenAI Codex** | `AGENTS.md` (native instructions) | `.codex/config.toml` (MCP) | Already minimal; fine |
| **OpenCode** | `AGENTS.md` (default `instructions`) + **`.claude/skills/`** natively | `.opencode/opencode.json` (`mcp`, deep-merged) | Already done in 0011; skills reused as-is |

**Cross-cutting insight:** **AGENTS.md is becoming the universal native instructions file** (Codex, OpenCode,
Copilot, others). The generator's architecture (AGENTS.md = single source, everything else a projection) is
*exactly right* — but the **Copilot mirror** predates Copilot's AGENTS.md support and is now redundant. This is
the per-agent modernization to make.

---

## 6. Gap analysis — principle → our violation → fix direction

| Principle (source) | Current generated output | Fix direction |
|---|---|---|
| Description = 3rd person, what+when, key terms (§3) | `summary + "Trigger: …the X phase of an SDD change"` (circular) | Author intent-based descriptions per phase ("Use when you need to investigate a feature/bug before choosing an approach…") |
| Right altitude — concrete signals (§4) | 1 sentence (`p.does`) + 3 generic bullets | Rich, medium-freedom skill: **what to read → output template (sections) → quality checklist → examples** |
| Progressive disclosure, <500 lines, references/ (§3) | No references; nothing to load | SKILL.md = lean overview; `references/<phase>.md` with the full template + examples + checklist |
| Unambiguous, non-overlapping skills/tools (§4) | Command **and** skill per phase, near-identical | **Invert:** SKILL.md = substance; `/sdd-*` command = 2-line launcher pointing to the skill |
| Delta specs ADDED/MODIFIED/REMOVED + RFC2119 + Requirement/Scenario (§2) | freeform MUST/SHOULD + ad-hoc Given/When/Then; no delta markers | Adopt OpenSpec delta format in the generated `spec.md` template + the `sdd-spec`/`sdd-archive` skills + `sdd-convention.md` |
| Clarification gate + NEEDS CLARIFICATION + Success Criteria (§1) | `clarify` phase exists but inconsistent; specs lack `[NEEDS CLARIFICATION]` / measurable SC | Make `clarify` first-class & consistent; add `[NEEDS CLARIFICATION]` + Success Criteria (`SC-…`) to the spec template |
| Read-only consistency pass (§1 `/analyze`) | none | Consider a generated `/sdd-analyze` (read-only) skill that cross-checks proposal/spec/design/tasks |
| Copilot reads AGENTS.md natively (§5) | full `.github/copilot-instructions.md` mirror | Slim the mirror to a pointer / keep only path-scoped instructions + prompts |
| Eval-driven skills (§3) | none | Ship a tiny eval rubric per generated skill (or at least document the pattern) |
| `clarify.md` consistency | omitted from `sdd-convention.md`; missing from `workflow` block flow | Add `clarify.md` everywhere or remove deliberately; one consistent flow across all AGENTS.md blocks |
| `lean` vs `reasons` cliff | lean gets only thin skills | Bring 1–2 substantive references into the base (lean) tier |
| `sdd-convention.md` `writeIfMissing` | drifts on existing repos | Make it regenerated/managed |

---

## 7. Proposed design directions (for the proposal phase)

1. **Phase model as rich data.** Extend `Phase` (`src/i18n/strings.ts`) from `{name, summary, does}` to include
   `description` (intent-based, 3rd person), `reads` (inputs), `produces` (file + **section template**),
   `quality` (checklist), and optional `forNew`/`forExisting` notes. "Skills as data" applied to SDD phases.
2. **SKILL.md = substance, command = pointer.** `generateSkills` emits a rich, <500-line SKILL.md per phase with
   the output template + checklist + 1–2 examples, plus `references/<phase>.md` for the long detail.
   `generateSdd` emits a 2-line `/sdd-<phase>` launcher ("Run the `sdd-<phase>` skill.").
3. **Harden the spec/delta format.** Generated `spec.md` template + `sdd-spec`/`sdd-archive` skills adopt
   OpenSpec deltas (ADDED/MODIFIED/REMOVED, `### Requirement:`/`#### Scenario:` GIVEN/WHEN/THEN, RFC 2119) and
   Spec-Kit's `[NEEDS CLARIFICATION]` + **Success Criteria** + priorities.
4. **Consistency + analyze.** Fix `clarify` across all blocks; add an optional read-only `/sdd-analyze`.
5. **Per-agent modernization.** Slim the Copilot mirror now that Copilot reads `AGENTS.md` natively; keep
   path-scoped `instructions/*` + prompts.
6. **Floor for `lean`.** A couple of substantive base references even without `reasons`.
7. **Eval rubric.** Optional `references/eval.md` per skill (3 scenarios) to make quality measurable.
8. **Regenerate `sdd-convention.md`.** Stop using `writeIfMissing` for it.

## 8. Scope note (it's big)

Recommend splitting into reviewable sub-changes, e.g.:
- **0012a** — rich Phase data model + SKILL.md-as-substance + command-as-pointer + references/ (the core).
- **0012b** — spec/delta format hardening (OpenSpec deltas + Spec-Kit clarification/success-criteria) + archive merge rules.
- **0012c** — per-agent modernization (Copilot AGENTS.md-native slimming) + clarify consistency + optional `/sdd-analyze`.
- **0012d** — `lean` floor + eval rubric + `sdd-convention.md` regeneration.

Each keeps the architecture invariant (AGENTS.md single source; idempotency; byte-baseline fixtures regenerated
deliberately; `TEMPLATES_VERSION` bumped).

## Sources
- Spec-Kit: https://github.com/github/spec-kit · https://github.com/github/spec-kit/blob/main/spec-driven.md · https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md
- OpenSpec: https://github.com/Fission-AI/OpenSpec · https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md
- Agent Skills: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices · https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Copilot: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot · https://github.com/github/awesome-copilot
