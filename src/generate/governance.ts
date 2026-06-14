import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeFile, writeIfMissing, type WriteResult } from "../render/writer.js";

/**
 * Governance artifacts: skills + commands that enforce the version/security/commit
 * policy declared in AGENTS.md, plus a commit-msg git hook for hard enforcement.
 */

function frontmatter(name: string, description: string): string {
  return ["---", `name: ${name}`, "description: >", `  ${description}`, "license: Apache-2.0", "metadata:", "  author: ai-workspace", '  version: "1.0"', "---", ""].join("\n");
}

// --- dependency-upgrade skill ------------------------------------------------

const DEP_UPGRADE_ES = `## dependency-upgrade

Evalúa, con rigor, si subir una versión o migrar es **viable y conveniente** — antes de tocar nada.
Nunca subas versiones ni migres por iniciativa propia: esto es un cambio deliberado que requiere
aprobación del usuario (ver "Barrera de seguridad" en AGENTS.md).

### Cuándo
El usuario pide actualizar una dependencia/lenguaje/framework, migrar, o resolver un conflicto de versiones.

### Procedimiento (no te saltes pasos)
1. **Inventario:** versión actual y por qué está fijada (proyecto existente = conservador por defecto).
2. **Objetivo:** última estable / LTS reales — consúltalo en **context7**, no de memoria.
3. **Compatibilidad:** revisa peer-dependencies de TODO el stack; detecta incompatibilidades en cadena.
4. **Cambios incompatibles:** lista breaking changes y qué partes del código habría que **sustituir**.
5. **Seguridad:** avisos/CVEs de la versión actual y de la objetivo; dependencias sin mantenimiento.
6. **Veredicto de viabilidad:** *hacer ahora* / *parcial (qué sí, qué no)* / *posponer*, con esfuerzo y riesgo.
7. **Recomendación a largo plazo** explícita y **espera la decisión del usuario**.
8. Escribe el informe (p. ej. en \`openspec/changes/<cambio>/\` o \`docs/ai/\`). Si se aprueba, hazlo por pasos pequeños y verificables.

> Si la migración no es viable de forma segura, dilo claramente y propón el camino conservador.
`;

const DEP_UPGRADE_EN = `## dependency-upgrade

Rigorously assess whether a version bump or migration is **feasible and worth it** — before touching
anything. Never upgrade or migrate on your own initiative: it is a deliberate change requiring user
approval (see "Safety gate" in AGENTS.md).

### When
The user asks to update a dependency/language/framework, migrate, or resolve a version conflict.

### Procedure (do not skip steps)
1. **Inventory:** current version and why it's pinned (existing project = conservative by default).
2. **Target:** real latest stable / LTS — check **context7**, not memory.
3. **Compatibility:** review peer-dependencies across the WHOLE stack; find cascading incompatibilities.
4. **Breaking changes:** list them and which parts of the code would need to be **replaced**.
5. **Security:** advisories/CVEs for current and target versions; unmaintained deps.
6. **Feasibility verdict:** *do now* / *partial (what yes, what no)* / *defer*, with effort and risk.
7. State the **long-term recommendation** explicitly and **wait for the user's decision**.
8. Write the report (e.g. in \`openspec/changes/<change>/\` or \`docs/ai/\`). If approved, do it in small, verifiable steps.

> If the migration can't be done safely, say so clearly and propose the conservative path.
`;

// --- secure-commit skill -----------------------------------------------------

function secureCommit(config: Config): string {
  const es = config.language === "es";
  const c = config.workflow.commits;
  if (es) {
    return `## secure-commit

Crea commits siguiendo la política del proyecto. ${c.automate === "with-approval" ? "Prepara y **pide aprobación** antes de commitear." : "**Nunca** commitees automáticamente; deja el commit al usuario."}

### Reglas
- ${c.conventional ? "Conventional Commits en imperativo (`feat:`, `fix:`, …). Un cambio lógico por commit." : "Mensaje claro en imperativo. Un cambio lógico por commit."}
- Autoría: la **identidad de git del usuario**.${c.coAuthor ? "" : " **No** añadas `Co-Authored-By:` ni atribución a la IA."}
- Nunca uses \`--no-verify\` ni te saltes hooks.

### Flujo
1. Agrupa solo los cambios de esta tarea (\`git add\` selectivo).
2. Redacta el mensaje (asunto ≤ 72, cuerpo con el porqué).
3. ${c.automate === "with-approval" ? "Muestra el diff y el mensaje, pide confirmación y commitea al aprobar." : "Entrega el mensaje propuesto; el usuario commitea."}
`;
  }
  return `## secure-commit

Create commits following the project policy. ${c.automate === "with-approval" ? "Prepare and **ask for approval** before committing." : "**Never** commit automatically; leave it to the user."}

### Rules
- ${c.conventional ? "Conventional Commits, imperative (`feat:`, `fix:`, …). One logical change per commit." : "Clear imperative message. One logical change per commit."}
- Authored by the **user's git identity**.${c.coAuthor ? "" : " Do **not** add `Co-Authored-By:` or AI attribution."}
- Never use \`--no-verify\` or bypass hooks.

### Flow
1. Stage only this task's changes (selective \`git add\`).
2. Write the message (subject ≤ 72, body with the why).
3. ${c.automate === "with-approval" ? "Show the diff and message, ask for confirmation, commit on approval." : "Hand over the proposed message; the user commits."}
`;
}

// --- commands ----------------------------------------------------------------

function commitCommand(config: Config): string {
  const es = config.language === "es";
  return es
    ? `---
description: Crea un commit siguiendo la política del proyecto (sin co-author, con aprobación).
---

# /commit

Sigue la skill \`secure-commit\` y la política de commits de AGENTS.md. Prepara un commit con los
cambios de la tarea actual, muéstrame el mensaje y ${config.workflow.commits.automate === "with-approval" ? "espera mi aprobación antes de ejecutarlo" : "déjame commitear a mí"}.
Nunca añadas Co-Authored-By ni uses --no-verify.
`
    : `---
description: Create a commit following the project policy (no co-author, with approval).
---

# /commit

Follow the \`secure-commit\` skill and the commit policy in AGENTS.md. Prepare a commit with the current
task's changes, show me the message and ${config.workflow.commits.automate === "with-approval" ? "wait for my approval before running it" : "let me commit"}.
Never add Co-Authored-By or use --no-verify.
`;
}

function upgradeDepsCommand(config: Config): string {
  const es = config.language === "es";
  return es
    ? `---
description: Evalúa una subida de versión/migración con la skill dependency-upgrade (viabilidad + seguridad).
---

# /upgrade-deps

Sigue la skill \`dependency-upgrade\`. No cambies nada todavía: investiga viabilidad, compatibilidad y
seguridad (usa context7), dame un veredicto con la recomendación a largo plazo y espera mi decisión.
`
    : `---
description: Assess a version bump/migration with the dependency-upgrade skill (feasibility + security).
---

# /upgrade-deps

Follow the \`dependency-upgrade\` skill. Do not change anything yet: investigate feasibility, compatibility
and security (use context7), give me a verdict with the long-term recommendation, and wait for my decision.
`;
}

function commandPrompt(body: string): string {
  return `---\nmode: agent\n---\n\n${body}`;
}

// --- commit-msg git hook -----------------------------------------------------

function commitMsgHook(config: Config): string {
  const blockCoAuthor = !config.workflow.commits.coAuthor;
  const conventional = config.workflow.commits.conventional;
  return `#!/bin/sh
# Managed by ai-workspace. Activate once: git config core.hooksPath .githooks
msg_file="$1"
subject="$(head -n1 "$msg_file")"
${blockCoAuthor ? `if grep -qiE '^Co-Authored-By:' "$msg_file"; then
  echo "x Commit policy: Co-Authored-By / AI attribution trailers are not allowed." >&2
  exit 1
fi` : "# co-author check disabled"}
${conventional ? `case "$subject" in
  feat:*|fix:*|refactor:*|docs:*|test:*|chore:*|build:*|ci:*|perf:*|style:*|revert:*|feat\\(*|fix\\(*|refactor\\(*|docs\\(*|test\\(*|chore\\(*|build\\(*|ci\\(*|perf\\(*|style\\(*|revert\\(*) ;;
  Merge*|Revert*) ;;
  *)
    echo "x Commit policy: use Conventional Commits (e.g. 'feat: ...'). Got: $subject" >&2
    exit 1 ;;
esac` : "# conventional check disabled"}
exit 0
`;
}

export function generateGovernance(cwd: string, config: Config): WriteResult[] {
  const results: WriteResult[] = [];
  const es = config.language === "es";

  if (config.targets.includes("claude")) {
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/dependency-upgrade/SKILL.md"),
        frontmatter("dependency-upgrade", es
          ? "Evalúa viabilidad y seguridad de subir versiones o migrar antes de tocar nada. Trigger: cuando se pide actualizar dependencias, migrar o resolver conflictos de versión."
          : "Assess feasibility and security of version bumps/migrations before touching anything. Trigger: when asked to update dependencies, migrate, or resolve version conflicts.") + (es ? DEP_UPGRADE_ES : DEP_UPGRADE_EN),
      ),
    );
    results.push(
      writeFile(
        resolve(cwd, ".claude/skills/secure-commit/SKILL.md"),
        frontmatter("secure-commit", es
          ? "Crea commits según la política (sin co-author, con aprobación, conventional). Trigger: al commitear cambios."
          : "Create commits per policy (no co-author, with approval, conventional). Trigger: when committing changes.") + secureCommit(config),
      ),
    );
    results.push(writeFile(resolve(cwd, ".claude/commands/commit.md"), commitCommand(config)));
    results.push(writeFile(resolve(cwd, ".claude/commands/upgrade-deps.md"), upgradeDepsCommand(config)));
  }

  if (config.targets.includes("copilot")) {
    results.push(writeFile(resolve(cwd, ".github/prompts/commit.prompt.md"), commandPrompt(commitCommand(config).split("---\n").pop() ?? "")));
    results.push(writeFile(resolve(cwd, ".github/prompts/upgrade-deps.prompt.md"), commandPrompt(upgradeDepsCommand(config).split("---\n").pop() ?? "")));
  }

  if (config.workflow.commits.gitHook) {
    results.push(writeFile(resolve(cwd, ".githooks/commit-msg"), commitMsgHook(config)));
  }

  return results;
}
