---
name: aiws-dependency-upgrade
description: >
  Assess feasibility and security of version bumps/migrations before touching anything. Trigger: when asked to update dependencies, migrate, or resolve version conflicts.
license: Apache-2.0
metadata:
  author: ai-workspace
  source: aiws@0.53.0
  version: "1.0"
---
## aiws-dependency-upgrade

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
8. Write the report (e.g. in `docs/development/changes/<change>/` or `docs/development/status/`). If approved, do it in small, verifiable steps.

> If the migration can't be done safely, say so clearly and propose the conservative path.
