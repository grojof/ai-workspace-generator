import { resolve } from "node:path";
import type { Config } from "../config/schema.js";
import { writeIfMissing, type WriteResult } from "../render/writer.js";
import { docsPaths } from "./paths.js";

/**
 * A `docs/README.md` that explains the documentation layout in the project's language. User-owned
 * (writeIfMissing) so teams can expand it. Folder names are stable English; only the prose is localized.
 */
export function generateDocsIndex(cwd: string, config: Config): WriteResult[] {
  const p = docsPaths(config);
  const body =
    config.language === "es"
      ? `# Documentación

Estructura de la documentación de este proyecto. Los **nombres de carpeta son estables (en inglés)**
para ser predecibles para herramientas y para la IA; el **contenido** va en el idioma del proyecto.

- \`${p.project}/\` — **documentación del proyecto** (para personas): visión, guías, decisiones.
- \`${p.development}/\` — **proceso de desarrollo** (mantenido con IA):
  - \`${p.specs}/\` — especificaciones vigentes (la verdad actual del comportamiento).
  - \`${p.changes}/\` — cambios SDD en curso (\`${p.archive}/\` para los completados).
  - \`${p.status}/\` — foto viva del proyecto (\`PROJECT-STATE.md\`, \`ARCHITECTURE.md\`); refréscala con \`/aiws-doc-sync\`.
`
      : `# Documentation

How this project's documentation is organized. **Folder names are stable (English)** so they're
predictable for tooling and the AI; the **content** is in the project's language.

- \`${p.project}/\` — **project documentation** (for people): overview, guides, decisions.
- \`${p.development}/\` — **development process** (AI-maintained):
  - \`${p.specs}/\` — current specifications (the source of truth for behavior).
  - \`${p.changes}/\` — in-flight SDD changes (\`${p.archive}/\` for completed ones).
  - \`${p.status}/\` — living project snapshot (\`PROJECT-STATE.md\`, \`ARCHITECTURE.md\`); refresh with \`/aiws-doc-sync\`.
`;
  return [writeIfMissing(resolve(cwd, "docs/README.md"), body)];
}
