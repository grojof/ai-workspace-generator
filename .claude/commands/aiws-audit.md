---
description: Run a read-only self-audit of the workspace and write a dated report.
---

# /aiws-audit

Run the **`aiws-audit`** skill — it gathers `ai-workspace doctor` / `verify` / `reconcile` signals plus
repo health, synthesizes prioritized findings (🔴/🟡/🟢), and writes a dated report under
`docs/development/audits/`. Read-only: it reports and recommends; it never fixes.
