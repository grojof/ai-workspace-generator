# Documentation

How this repository's documentation is organized. **Folder names are stable (English)** so they're
predictable for tooling and the AI. Deep guides are written in **English** (canonical); the root `README` and
the **[usage guide](project/USAGE.md)** are also available in Spanish.

- **[`project/`](project/README.md)** — project documentation (for people): the **[usage guide](project/USAGE.md)**
  (CLI + config + multi-repo), architecture, how to extend and maintain, distribution, and the decisions (ADR).
- **[`development/`](development/README.md)** — development process (AI-maintained):
  - `specs/` — current specifications (the source of truth for behavior).
  - `changes/` — in-flight SDD changes (`changes/archive/` for completed ones).
  - `status/` — living project snapshot (`PROJECT-STATE.md`); refresh with `/doc-sync`.

> Start at the **[root README](../README.md)** (overview) or **[project/](project/README.md)** for detail.
