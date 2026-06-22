import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, type WriteResult } from "../render/writer.js";
import { phasesFor } from "./sdd.js";
import { docsPaths } from "./paths.js";
import { skillFrontmatter as frontmatter, aiwsId } from "./naming.js";
import type { Phase } from "../i18n/strings.js";

// AI skill → English only (token efficiency). Rich, self-contained, "right altitude" (0012a): an
// intent-based description (not a circular trigger), what to read, the output template, and a quality bar.
function sddSkill(p: Phase, config: Config): string {
  const store = docsPaths(config);
  const phase = p.name.replace("sdd-", "");
  const description = p.description ?? `${p.summary} ${p.does}`;
  const storeLine =
    config.sdd.backend === "none"
      ? "Backend is `none`: artifacts are not persisted to disk — keep them in the working context."
      : `Artifacts live in \`${store.changes}/<change>/\` and are versioned in git.`;

  const body: string[] = [`## ${aiwsId(p.name)}`, "", p.does, ""];

  if (p.reads?.length) {
    body.push("## Read first", ...p.reads.map((r) => `- ${r}`), "");
  }
  if (p.produces) {
    body.push(`## Produce — \`${p.produces.file}\``, ...p.produces.sections.map((s) => `- ${s}`), "");
  }
  if (p.quality?.length) {
    body.push("## Quality bar", ...p.quality.map((q) => `- [ ] ${q}`), "");
  }
  body.push(
    "## How to work",
    `1. Read the prior artifacts in the change folder before writing \`${p.produces?.file ?? `${phase}.md`}\`.`,
    "2. Fill the section template above; keep it concise and high-signal.",
    "3. Self-check against the quality bar before moving to the next phase.",
    "",
    `> ${storeLine} Follow the SDD lifecycle in AGENTS.md and \`_shared/aiws-sdd-convention.md\`.`,
  );

  return [frontmatter(aiwsId(p.name), description), ...body].join("\n");
}

// AI skill (shared convention) → English only (token efficiency).
function sddConvention(config: Config): string {
  const s = docsPaths(config);
  return `# SDD store convention (shared)

SDD artifacts are plain markdown, versioned in git, readable by any AI tool. Follows OpenSpec's
*layout* (specs + changes + archive) as a convention — no external CLI.

Layout:
- \`${s.specs}/\`            — stable specifications (the current truth)
- \`${s.changes}/<name>/\`   — an in-flight change
  - \`explore.md\`  · investigation and options
  - \`proposal.md\` · intent, scope, approach, risks
  - \`clarify.md\`  · questions + decisions that resolve ambiguity before the spec
  - \`spec.md\`     · requirements + acceptance scenarios (WHAT)
  - \`design.md\`   · technical design + Mermaid diagrams (HOW)
  - \`tasks.md\`    · ordered checklist (progress)
  - \`verify-report.md\` · validation against the spec
- \`${s.archive}/\`  — completed changes

Rules:
- One change folder per logical change. Keep the spec as the source of truth for behavior.
- Archive a change only after verify passes; fold its delta into \`${s.specs}/\`.

## Delta spec format (OpenSpec)

A change's \`spec.md\` is a **delta** against the current \`${s.specs}/\`, not a full rewrite. Use the three
delta headers, and under each a requirement + at least one scenario:

\`\`\`markdown
## ADDED Requirements
### Requirement: <name>
The system MUST … (RFC 2119: MUST/SHALL · SHOULD · MAY)
#### Scenario: <name>
- GIVEN <state> WHEN <action> THEN <outcome> AND <…>

## MODIFIED Requirements
### Requirement: <name>            (Previously: <old behaviour>)

## REMOVED Requirements
### Requirement: <name>            (Reason: <…>)
\`\`\`

- Mark anything still open inline with \`[NEEDS CLARIFICATION: <question>]\` — resolve before sign-off.
- Add measurable **Success Criteria** (\`SC-001…\`).

## Archive merge rules

When archiving (after verify passes), fold the delta into \`${s.specs}/\` deterministically, then move the
change folder to \`${s.archive}/<date-name>/\` preserving its full context:

- **ADDED** → append the requirement to the matching domain spec.
- **MODIFIED** → replace the existing requirement's body.
- **REMOVED** → delete the requirement.

## Evaluating a skill (the quality bar in practice)

Each phase skill ships a **Quality bar** checklist — that is its eval rubric. Before moving on, judge the
artifact against it with 2–3 quick scenarios rather than a vague "looks good":

- **Typical** — a normal change: does the artifact pass every quality item?
- **Edge** — a thin or ambiguous input: are gaps named (e.g. \`[NEEDS CLARIFICATION]\`) instead of guessed?
- **Anti** — a tempting shortcut (skipping clarify, HOW in the spec, gold-plating the design): is it caught?

If an artifact fails its quality bar, fix the artifact (or the upstream phase) before proceeding — the bar is
the contract, not a suggestion.
`;
}

// AI skill → English only (token efficiency).
function livingDocsSkillBody(config: Config): string {
  const p = docsPaths(config);
  return `## aiws-living-docs

Maintain an always-current, token-cheap snapshot of the project so agents get context without
re-scanning the repo.

## What to keep current
- \`${p.status}/PROJECT-STATE.md\` — overview, module map, decisions log, current status.
- \`${p.status}/ARCHITECTURE.md\` — architecture with Mermaid diagrams.

## How to update
1. Scan recent changes (git status/log, modified modules).
2. If SDD is active, summarize each folder under \`${p.changes}/*\`.
3. Rewrite only content inside \`ai-workspace:begin/end\` markers; preserve manual notes outside.
4. Keep it concise and scannable — this is read often.

Invoke via the \`/aiws-doc-sync\` command (Claude) or the \`aiws-doc-sync\` prompt (Copilot).
`;
}

// AI skill → English only. The reconcile skill is propose-and-review: it reads the deterministic report and
// proposes changes for the user's approval — it never auto-edits (Safety gate, ADR 0003 Part F).
function reconcileSkillBody(): string {
  return `## aiws-reconcile

Audit the company overlay (its \`corp-<handle>-*\` packs) against the current base catalog after a base
upgrade, and **propose** how to reconcile — never auto-apply.

## How to work
1. Run \`ai-workspace reconcile\` to get the classification (read-only):
   - 🔵 **unique** — an independent company skill (\`relation: new\`/\`extends\`): keep.
   - 🟢 **redundant** — \`overrides:<aiws-id>\` whose target is no longer in the base: the override is stale → propose review/removal.
   - 🟡 **conflict** — \`overrides:<aiws-id>\` of a live base skill: the base may have moved → diff the two and let the user decide.
   - ⚠️ **drift** — a base artifact edited out of band (from \`ai-workspace verify\`): propose restoring with \`ai-workspace sync\`.
2. For each 🟡/🟢/⚠️, present a concrete proposal (what changes, why) and **wait for approval**.
3. Apply only what the user approves: edit the company pack repo + re-run \`ai-workspace packs sync\`, or restore base files with \`sync\`.

## Quality bar
- [ ] Every 🟡 conflict shows the base-vs-overlay difference, not just a label
- [ ] Nothing is edited without explicit approval (propose-and-review)
- [ ] Drift is healed via \`sync\`, never by hand-editing managed regions
`;
}

// AI skill → English only. Read-only self-audit (0016b): gathers deterministic signals, synthesizes a
// prioritized dated report, and proposes — it never fixes (that goes through SDD / doctor / sync).
function auditSkillBody(config: Config): string {
  const p = docsPaths(config);
  return `## aiws-audit

Produce a periodic, **read-only** self-audit of this workspace and write it as a dated report, so the project
improves from its own state over time. It reports and recommends — it never fixes.

## How to work
1. Gather signals (all read-only):
   - \`ai-workspace doctor\` — token budget, orphaned blocks, **dangling doc references**, **orphan docs**, stack/MCP registry.
   - \`ai-workspace verify\` — integrity of base artifacts vs the manifest (tampering / in-region drift).
   - \`ai-workspace reconcile\` — company overlay vs base (only if a company overlay is configured).
   - Repo health — \`git status\`/log, the test/lint/build scripts, and the declared \`docs.contract\`.
2. Synthesize findings into **severity tiers** — 🔴 must-fix · 🟡 should · 🟢 watch — each with *what*, *why it
   matters*, and a **concrete recommendation**. Prioritize **coherence gaps** (the harness preaching standards
   the repo doesn't meet) and **drift**, since those are what silently rot.
3. Write the report to \`${p.development}/audits/<YYYY-MM-DD>-audit.md\` (dated, so improvements compound across
   audits). Link the previous report so progress is visible.
4. Present the top findings and **propose** next steps. Make **no** changes here — fixes go through the normal
   flow (SDD for non-trivial, \`doctor\`/\`sync\` for coherence) with the user's approval.

## Quality bar
- [ ] Every finding is evidence-backed (a command output or a \`file:line\`), not a guess
- [ ] Findings are prioritized; the report leads with what matters most
- [ ] Read-only: nothing is edited — recommendations only
- [ ] The report is dated and self-contained (a reader needs no extra context)
`;
}

function auditCommand(config: Config): string {
  const p = docsPaths(config);
  return [
    "---",
    "description: Run a read-only self-audit of the workspace and write a dated report.",
    "---",
    "",
    "# /aiws-audit",
    "",
    "Run the **`aiws-audit`** skill — it gathers `ai-workspace doctor` / `verify` / `reconcile` signals plus",
    `repo health, synthesizes prioritized findings (🔴/🟡/🟢), and writes a dated report under`,
    `\`${p.development}/audits/\`. Read-only: it reports and recommends; it never fixes.`,
  ].join("\n");
}

function reconcileCommand(): string {
  return [
    "---",
    "description: Reconcile company overlays against the base (propose-and-review).",
    "---",
    "",
    "# /aiws-reconcile",
    "",
    "Run the **`aiws-reconcile`** skill — it runs `ai-workspace reconcile`, classifies each company overlay",
    "(🔵 unique · 🟢 redundant · 🟡 conflict · ⚠️ drift) and **proposes** changes for your approval. Nothing is",
    "auto-applied.",
  ].join("\n");
}

/** Generate vendored skills into the repo (`.claude/skills/`). Claude target only. */
export function generateSkills(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (!config.targets.includes("claude")) return results;

  if (config.sdd.enabled && config.sdd.vendorSkills) {
    for (const p of phasesFor(config)) {
      results.push(writeFile(resolve(cwd, `.claude/skills/${aiwsId(p.name)}/SKILL.md`), sddSkill(p, config)));
    }
    // Regenerated (not writeIfMissing) so existing repos get convention updates on sync — it's OUR canonical
    // reference, not a user-owned scaffold (0012d).
    results.push(
      writeFile(resolve(cwd, ".claude/skills/_shared/aiws-sdd-convention.md"), sddConvention(config)),
    );
    // REASONS-mode skills (sdd-spec-schema/onboarding/migrate, builder, audits) live in skill-packs/
    // (skills-as-data) — generated by generateStackPacks via declarative gating + tokens.
  }

  // Company business-content skills (corp-*) are an optional extension: ship your own packs in skill-packs/.

  if (config.livingDocs) {
    const desc =
      "Keep the living docs (project status) current so the AI always has fresh project context. Trigger: after finishing a task or when project state changed.";
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/aiws-living-docs/SKILL.md"),
        frontmatter("aiws-living-docs", desc) + livingDocsSkillBody(config),
      ),
    );
  }

  // Reconcile skill + command — only when an org overlay is in play (a company to reconcile). Propose-and-review.
  if (config.company.id !== "none") {
    const desc =
      "Audit the company overlay against the base catalog after an upgrade and propose how to reconcile (unique/redundant/conflict/drift). Use after a base upgrade or `ai-workspace packs sync`, when company packs may overlap or clash with new base content. Propose-and-review — never auto-applies.";
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/aiws-reconcile/SKILL.md"),
        frontmatter("aiws-reconcile", desc) + reconcileSkillBody(),
      ),
    );
    results.push(writeFile(resolve(cwd, ".claude/commands/aiws-reconcile.md"), reconcileCommand()));
  }

  // Self-audit skill + command (0016b): read-only, periodic health/coherence report. Always available.
  const auditDesc =
    "Produce a prioritized, read-only audit of the workspace's health and coherence (code, docs, integrity, standards) as a dated report. Use periodically or after big changes to surface what to improve. Read-only — it reports and recommends, never fixes.";
  results.push(
    writeFile(
      resolve(cwd, ".claude/skills/aiws-audit/SKILL.md"),
      frontmatter("aiws-audit", auditDesc) + auditSkillBody(config),
    ),
  );
  results.push(writeFile(resolve(cwd, ".claude/commands/aiws-audit.md"), auditCommand(config)));

  return results;
}
