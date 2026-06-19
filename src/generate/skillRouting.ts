import type { Config } from "../config/schema.js";
import { selectSkills, type SkillLoadMode } from "../modules/skills.js";
import { stackPackSkillEntries } from "./stackPacks.js";

const ORDER: Record<SkillLoadMode, number> = { always: 0, suggested: 1, "on-demand": 2, "advanced-only": 3 };
const LOAD_LABEL: Record<SkillLoadMode, string> = {
  always: "always",
  suggested: "suggested",
  "on-demand": "on-demand",
  "advanced-only": "advanced",
};

export interface RoutedSkill {
  id: string;
  trigger: { en: string; es: string };
  load: string;
  risk: string;
}

/**
 * The skills surfaced for the active profile: catalog skills + stack packs (the latter derived from each
 * pack's `pack.yaml`), merged and sorted by load mode. Shared by the AGENTS.md routing block and the
 * `init` wizard preview so both stay in sync.
 */
export function routedSkills(config: Config): RoutedSkill[] {
  return [...selectSkills(config), ...stackPackSkillEntries(config)]
    .sort((a, b) => ORDER[a.loadMode] - ORDER[b.loadMode])
    .map((s) => ({ id: s.id, trigger: s.trigger, load: LOAD_LABEL[s.loadMode], risk: s.risk }));
}

/**
 * Build the compact `skill-routing` block for AGENTS.md: which skills to surface for the active profile,
 * and when. Derived from the skill registry, filtered by profile. AGENTS.md is AI-facing, so this block
 * is English-only (token efficiency) regardless of `config.language`. Lists triggers, never skill content.
 */
export function renderSkillRouting(config: Config): string {
  const { userType, experience } = config.profile;
  const riskNote = (risk: string) => (risk === "high" ? " · high risk" : "");
  const rows = routedSkills(config).map(
    (s) => `| \`${s.id}\` | ${s.trigger.en} | ${s.load}${riskNote(s.risk)} |`,
  );

  return [
    "## Skill routing (Layer 0)",
    "",
    `Load skills by their *trigger*, not preemptively. Selection for the **${userType}** · **${experience}** profile:`,
    "",
    "| Skill | When | Load |",
    "|-------|------|------|",
    ...rows,
    "",
    "> `always` skills are the baseline; `suggested` ones activate by context; `on-demand` only when asked.",
    "> Don't activate skills that don't apply to this profile.",
  ].join("\n");
}
