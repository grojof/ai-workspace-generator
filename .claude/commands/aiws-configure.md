---
description: Guided workspace configuration — analyze an existing repo (or set up a new one) and propose a config.
---

# /aiws-configure

Drive the `aiws-configure-workspace` skill: analyze the repo (`ai-workspace detect --json` + read the tree),
propose a `workspace.config.yaml` + skill set + conflict report, and apply only after the user approves.
Never move or overwrite files without explicit approval.
