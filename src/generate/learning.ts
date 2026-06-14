import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, type WriteResult } from "../render/writer.js";

/** Learning mode: a tutor skill + /learn command, generated only when purpose === "learn". */

function frontmatter(name: string, description: string): string {
  return ["---", `name: ${name}`, "description: >", `  ${description}`, "license: Apache-2.0", "metadata:", "  author: ai-workspace", '  version: "1.0"', "---", ""].join("\n");
}

const LEARN_SKILL_ES = `## learn — tutor

Eres un **tutor**, no un autocompletado. Ayuda a aprender lenguajes, frameworks, entornos o conceptos
(p. ej. Node, async a bajo nivel, patrones de diseño) con rigor y de forma activa.

### Cómo enseñar
1. Pregunta el **objetivo** y el **nivel** actual (y el plazo, p. ej. una entrevista).
2. Explica el **modelo mental** y el *porqué*, desde los fundamentos, con ejemplos cortos y correctos.
3. Tras cada concepto, **propón un ejercicio, una pregunta o un caso real**; espera la respuesta y da
   feedback concreto. No des la solución terminada de entrada.
4. Sube la dificultad de forma progresiva; comprueba que se entiende antes de avanzar.
5. Profundiza cuando se pida (internals, rendimiento, casos límite). Apóyate en **context7** para datos al día.
6. Cierra con un **resumen** y los siguientes pasos. Si procede, registra el progreso en \`docs/ai/LEARNING.md\`.

### Estilo
- Imperativo y socrático: haz pensar, no solo leer. Corrige errores con explicación.
- Ejemplos mínimos y ejecutables. Una idea por paso.
`;

const LEARN_SKILL_EN = `## learn — tutor

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

function learnCommand(es: boolean): string {
  return es
    ? `---
description: Modo tutor — aprende un tema con explicaciones, ejercicios y casos (usa la skill learn).
---

# /learn

Actúa como tutor siguiendo la skill \`learn\`. Pregunta objetivo y nivel, explica desde los fundamentos,
y plantea ejercicios/preguntas esperando mis respuestas. Tema: $ARGUMENTS
`
    : `---
description: Tutor mode — learn a topic with explanations, exercises and cases (uses the learn skill).
---

# /learn

Act as a tutor following the \`learn\` skill. Ask goal and level, explain from fundamentals, and pose
exercises/questions waiting for my answers. Topic: $ARGUMENTS
`;
}

function learnPrompt(es: boolean): string {
  return es
    ? `---\nmode: agent\ndescription: Modo tutor — aprende con explicaciones, ejercicios y casos.\n---\n\nActúa como tutor: pregunta objetivo y nivel, explica desde los fundamentos y plantea ejercicios esperando mis respuestas.`
    : `---\nmode: agent\ndescription: Tutor mode — learn with explanations, exercises and cases.\n---\n\nAct as a tutor: ask goal and level, explain from fundamentals and pose exercises waiting for my answers.`;
}

export function generateLearning(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  if (config.project.purpose !== "learn") return results;
  const es = config.language === "es";
  const desc = es
    ? "Tutor para aprender lenguajes, frameworks, entornos o conceptos con ejercicios y casos. Trigger: cuando el usuario quiere aprender, practicar o prepararse algo."
    : "Tutor to learn languages, frameworks, environments or concepts with exercises and cases. Trigger: when the user wants to learn, practice, or prepare a topic.";

  if (config.targets.includes("claude")) {
    results.push(writeFile(resolve(cwd, ".claude/skills/learn/SKILL.md"), frontmatter("learn", desc) + (es ? LEARN_SKILL_ES : LEARN_SKILL_EN)));
    results.push(writeFile(resolve(cwd, ".claude/commands/learn.md"), learnCommand(es)));
  }
  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/learn.prompt.md"), learnPrompt(es)));
  }
  return results;
}
