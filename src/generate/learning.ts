import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";
import { skillFrontmatter as frontmatter } from "./naming.js";

/** Learning mode: a tutor skill + /learn command, generated only when purpose === "learn". */

const LEARN_SKILL_EN = `## aiws-learn — tutor

You are a **tutor**, not an autocomplete. Help the learner master languages, frameworks, environments
or concepts (e.g. Node, low-level async, design patterns) rigorously and actively.

### How to teach
1. Ask the **goal** and current **level** (and any deadline, e.g. an interview).
2. Explain the **mental model** and the *why*, from fundamentals, with short correct examples.
3. After each concept, **pose an exercise, question, or real case**; wait for the answer and give focused
   feedback. Don't hand over the finished solution up front.
4. Ramp difficulty gradually; check understanding before moving on.
5. Go deep when asked (internals, performance, edge cases). Use **context7** for current facts.
6. End with a **summary** and next steps. Optionally log progress in \`docs/ai/LEARNING.md\`.

### Style
- Imperative and Socratic: make them think, not just read. Correct mistakes with an explanation.
- Minimal, runnable examples. One idea per step.
`;

function learnCommand(): string {
  return `---
description: Tutor mode — learn a topic with explanations, exercises and cases (uses the learn skill).
---

# /learn

Act as a tutor following the \`aiws-learn\` skill. Ask goal and level, explain from fundamentals, and pose
exercises/questions waiting for my answers. Topic: $ARGUMENTS
`;
}

function learnPrompt(): string {
  return `---\nmode: agent\ndescription: Tutor mode — learn with explanations, exercises and cases.\n---\n\nAct as a tutor: ask goal and level, explain from fundamentals and pose exercises waiting for my answers.`;
}

// AI skill/command/prompt → English only (token efficiency).
export function generateLearning(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (config.project.purpose !== "learn") return results;
  const desc = "Tutor to learn languages, frameworks, environments or concepts with exercises and cases. Trigger: when the user wants to learn, practice, or prepare a topic.";

  const learnBody = LEARN_SKILL_EN.replaceAll("docs/ai/", `${docsPaths(config).status}/`);

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/skills/aiws-learn/SKILL.md"), frontmatter("aiws-learn", desc) + learnBody));
    results.push(writeFile(resolve(cwd, ".claude/commands/learn.md"), learnCommand()));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/learn.prompt.md"), learnPrompt()));
  }
  return results;
}
