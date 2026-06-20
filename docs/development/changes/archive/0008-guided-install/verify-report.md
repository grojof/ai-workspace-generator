# Verify — AI-guided install (bootstrap from repo URL)

Verified against `npm test` (74/74), `ai-workspace doctor`, and a read-through of the new content.

| Req | Scenario | Result |
|-----|----------|--------|
| R1 | AGENTS.md carries a standing bootstrap directive | ✅ "### Installing & bootstrapping this generator" in the manual Contributor-guide region: OS detect → check git/node/npm → propose per-OS install **asking first** → install Release tarball → `init` → `/configure`; links `INSTALL.md` |
| R1 | Directive mandates consent before installs (Safety gate) | ✅ step 2 says "Ask before installing anything system-wide … never do it silently" |
| R2 | `INSTALL.md` documents guided + expert + update | ✅ Option A (AI-guided), Option B (from source), Update, and a maintainer release pointer |
| R3 | No hardcoded per-OS commands/versions | ✅ directive + playbook defer to official docs/context7; only the version-less `releases/latest/download/` install URL and the documented from-source commands are concrete |
| — | No runtime change; budgets fine | ✅ `npm test` 74/74; `doctor` 0/0; AGENTS.md 5707/6000 tokens (was 5448) |

## Notes
- README/USAGE install sections are intentionally **not** edited here — they are owned by change 0007 (open in
  PR #31). `INSTALL.md` is the canonical, linkable playbook; 0007's README note ("tell your AI to install from
  URL") is the entry hook once both merge.
- No `TEMPLATES_VERSION` bump: the directive lives in AGENTS.md's **manual** region (not a generated block).
- Depends on 0007 — the install source (Release tarball) is already live (v0.1.0).

## Status
**Ready to commit.** Archive after merge.
