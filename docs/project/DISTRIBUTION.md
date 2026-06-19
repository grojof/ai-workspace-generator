# Distribution & install (F6)

> How to package a generated workspace so it can be **installed** across the three Claude surfaces:
> VS Code/CLI, Claude Desktop/Cowork, and a company organization on claude.ai (Desktop + Workspace).

The generator produces **standalone** config under `.claude/` (perfect for a single repo). To **distribute**
it to several users, the **`ai-workspace package`** command projects those artifacts into a **Claude Code
plugin** served from the repo itself as a **private marketplace**, and stages **skill zips** to upload to an
organization. It is another *projection* of the same single source — `AGENTS.md` is never duplicated.

```bash
ai-workspace package
```

## A stable plugin name for the organization

By default the plugin and marketplace are derived from the repo name. To publish a **canonical org plugin**
(e.g. `acme-ai-workspace`) that **coexists with other org plugins** in a single private marketplace, pin the
names in the config:

```yaml
# workspace.config.yaml
distribution:
  plugin: acme-ai-workspace   # plugin id (kebab-case)
  marketplace: acme-tools     # marketplace id (kebab-case)
  owner: Acme IT              # author shown in the manifests
  perRepo: false              # true = one plugin per child repo (multi-repo); default = umbrella
```

This makes the id **independent of the consuming repo**: you can keep a reference repo that always produces
the same `acme-ai-workspace`, and consolidate several org plugins into a single marketplace.

## What it generates

| Artifact | Purpose |
|----------|---------|
| `.claude-plugin/marketplace.json` (root) | Turns **this repo** into a private marketplace (`metadata.pluginRoot: ./plugins`). |
| `plugins/<slug>/.claude-plugin/plugin.json` + `skills/` + `commands/` + `agents/` | The **umbrella plugin** with all generated skills, commands and companion subagents. |
| `dist/org-skills/<id>.zip` (one per skill, `SKILL.md` at the root) | **Upload skills to a claude.ai organization**. |
| `dist/INSTALL.md` | Per-surface install guide (with the git remote URL). |

> **Versioning:** commit `.claude-plugin/marketplace.json` and `plugins/<slug>/` (the marketplace serves
> them). `dist/` is build output (zips + guide) — optional in git. Re-running `package` is deterministic (no-op).

## Multi-repo

In a multi-repo workspace, `package` **aggregates** the skills, commands and subagents from the root **and
every child repo** (de-duped by id, first-wins) into the single umbrella plugin. With
`distribution.perRepo: true`, it instead emits **one plugin per child repo** (`plugins/<plugin>-<repo>/`,
root + that child) listed in a multi-plugin marketplace. Org zips + `INSTALL.md` always reflect the full
aggregate.

## The three surfaces

### 1. VS Code / CLI (Claude Code) — developers
The repo is the marketplace. In Claude Code:

```
/plugin marketplace add <owner/repo or git URL of this repo>
/plugin install <slug>@<marketplace>
```

**Private** repo (e.g. GHE): Claude Code uses your existing git credentials (`gh auth login`, SSH agent). For
background auto-updates, export a token (`GITHUB_TOKEN`/`GH_TOKEN`, or `GITLAB_TOKEN`). Update with
`/plugin marketplace update <marketplace>`.

### 2. Claude Desktop / Cowork (individual)
Use the plugin folder with `claude --plugin-dir ./plugins/<slug>`, or serve it as a `.zip` and load it with
`--plugin-url <url>`.

### 3. claude.ai Team/Enterprise — Desktop + Workspace for everyone
An organization **Owner** uploads the zips from `dist/org-skills/` in **Organization settings → Skills →
+ Add** (each zip has `SKILL.md` at its root). Requires enabling *Code execution and file creation* and
*Skills* for the org. Skills are then provisioned to everyone (web, Desktop, Cowork), on by default; each
member can disable them. **Only Owners** can add/remove organization skills.

## Design notes

- **Umbrella plugin** (not split) by default: a single install. It can be split by domain later without
  breaking the single source (`distribution.perRepo` is the per-repo variant).
- The ZIP writer is our own (`src/util/zip.ts`, *store* method, no dependencies, Node ≥ 20) and
  **deterministic** (fixed timestamp) → the zips are byte-identical across runs.
- The Claude Code plugin **namespaces** skills: they're invoked as `/<slug>:<skill>`.

## Sources (official Claude docs, verified)

- [Create plugins](https://code.claude.com/docs/en/plugins) · [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Provision and manage skills for your organization](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization)
