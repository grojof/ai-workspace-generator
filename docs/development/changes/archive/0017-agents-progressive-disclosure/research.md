# Research — how the ecosystem does agent compatibility (informs 0017b)

> Gathered 2026-06-23 via web/context7 (not from memory — the agent-instruction ecosystem moved fast).
> Purpose: decide 0017b (task-detail de-duplication) against how *other* systems actually make themselves
> compatible with these agents. **Headline: a decisive fact invalidates an assumption we were designing around.**

## The big one: Agent Skills is now a cross-tool OPEN STANDARD

Anthropic released **Agent Skills (`SKILL.md`) as an open standard on 2025-12-18** — spec + SDK for any
platform. As of 2026 it is adopted by **Claude Code, OpenAI Codex CLI, Gemini CLI, GitHub Copilot (VS Code),
Cursor, Cline, Windsurf, and opencode**, among 20+ tools. A skill written once works across all of them.

**This invalidates the constraint 0017's proposal was built on** ("Copilot/Codex have no skills, so task detail
needs a plain reference"). Our four targets — claude · copilot · codex · opencode — **all support `SKILL.md`
now.** Task-triggered detail therefore has a *native, cross-target* home: the skill.

The spec also standardizes **progressive disclosure** exactly as we want it:
1. **Metadata** (`name` + `description`, ~100 tokens) — loaded at startup for *all* skills.
2. **Instructions** (`SKILL.md` body, < ~5000 tokens) — loaded when the description matches the task.
3. **Resources** (`references/`, `scripts/`, `assets/` inside the skill) — loaded only when needed.

> "Consider splitting longer `SKILL.md` content into referenced files… Keep file references one level deep."
> — agentskills.io/specification. The skill-local `references/` dir is the canonical place for deep detail.

## The three-tier convergence (everyone landed on the same model)

| Tier | Trigger | Native mechanisms across tools |
|------|---------|--------------------------------|
| **Always** | every request | AGENTS.md root body · Cursor `.mdc` `alwaysApply: true` (use for **1–2 rules only**; "token tax" — every token loads every request) |
| **Path** | files being edited | Copilot `.github/instructions/*.instructions.md` `applyTo` glob · Cursor `.mdc` `globs` · **nested AGENTS.md** (nearest-wins; Codex ships 88, Copilot supports nested) |
| **Task/intent** | the agent reads a description and decides | **Agent Skills `SKILL.md` `description`** (cross-tool) · Cursor "Apply Intelligently" (`.mdc` description-only) |

Our 0017 maps onto this exactly: **Layer-0 = Always (inline)**, **0017a stack = Path (applyTo + references)**,
**0017b sdd/harness/living-docs = Task (skills)**.

## AGENTS.md the lingua franca + the "tool is the constraint" rule

- AGENTS.md is the **cross-tool root**; agents walk up the tree and combine nested files, **nearest wins**
  (Codex, Copilot, Cursor, opencode all honor this).
- 2026 stance, repeated across guides: **"if a constraint can be enforced deterministically by a tool already
  in the repo — linter, formatter, type checker, hook, CI — it must not be restated in AGENTS.md. The tool is
  the constraint."** Validates our PR #51 (lint/format in CI) *and* says some `lang-*` prose (formatter/linter
  reminders) should be **deleted**, not just moved to a reference.

## Implications for 0017b (revised design)

1. **Lean the AGENTS.md task blocks to pointers, trust the cross-tool skills.** `sdd` (492 tok),
   `harness-engineering` (281), `living-docs` (161) → a 2–4 line stance + "use the `aiws-sdd-*` /
   `aiws-living-docs` skill". The skills already carry the substance (0012a) and are now **cross-target**, so
   Copilot/Codex/opencode get them too — no separate plain-markdown reference needed. **Lower risk than the
   proposal feared.**
2. **Deep detail goes in the skill's own `references/` dir** (spec-aligned), not a repo-root `references/` —
   keep `SKILL.md` < ~500 lines and split the rest. (Stack stays at repo-root `references/stack/` because it is
   *path*-triggered, not a skill — different tier.)
3. **Align our generated skills to the Agent Skills spec**: `name` matches the dir and is lowercase-hyphen
   (already true for `aiws-*`); `description` ≤ 1024 chars and says *what + when*; optionally validate with the
   `skills-ref` tool in CI. Cheap coherence win.
4. **Prune, don't just move (the "tool is the constraint" rule):** in 0017b, drop `lang-*`/`sdd` lines that
   merely restate what ESLint/Prettier/CI or the skill already enforce, instead of relocating them.
5. **Open question for 0017b clarify:** do we keep `skill-routing` at all? With cross-tool skills self-
   advertising via their `description` (loaded at startup everywhere), the routing table partly duplicates that
   metadata. Candidate to slim once 0017b lands.

## Sources

- AGENTS.md spec + nesting: <https://agents.md/> · <https://developers.openai.com/codex/guides/agents-md> · <https://www.morphllm.com/agents-md-guide>
- Agent Skills open standard (cross-tool) + progressive disclosure: <https://agentskills.io/specification> · <https://www.agensi.io/learn/agent-skills-open-standard> · <https://code.visualstudio.com/docs/agent-customization/agent-skills> · <https://docs.github.com/en/copilot/concepts/agents/about-agent-skills>
- Copilot `applyTo` + AGENTS.md support: <https://docs.github.com/en/copilot/reference/custom-instructions-support> · <https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/>
- Cursor `.mdc` (alwaysApply/globs/description): <https://techsy.io/en/blog/cursor-rules-guide> · <https://www.datacamp.com/tutorial/cursor-rules>
