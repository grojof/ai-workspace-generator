<!-- 🇬🇧 English · install & update the `ai-workspace` CLI. Quick version in the README. -->

# Install & update

How to install **`ai-workspace-generator`** (the `ai-workspace` CLI). Two ways: let an **AI assistant install
it for you** from the repo URL, or do it **manually**. Both end with `ai-workspace init` in your repo.

> **Only requirement at runtime: Node.js ≥ 20.** `git` is needed only for the from-source path. A truly
> Node-less standalone binary is planned as a separate change.

## Option A — Guided (let your AI assistant install it)

The preferred path: tell your assistant (Claude Code, Copilot, Codex…)

> *"install ai-workspace from https://github.com/grojof/ai-workspace-generator"*

and it will, following the bootstrap directive in [`AGENTS.md`](AGENTS.md):

1. **Check prerequisites** — detect your OS and check `git`, `node` (≥ 20) and `npm`.
2. **Install what's missing, with your consent** — if Node/git is absent, the assistant proposes the official
   install for your OS (it asks first — installing system software is never silent). It uses up-to-date,
   per-OS instructions rather than guessing.
3. **Install the CLI** from the latest prebuilt Release tarball — no clone, no build:
   ```bash
   npm i -g https://github.com/grojof/ai-workspace-generator/releases/latest/download/ai-workspace-generator.tgz
   ```
4. **Verify & initialize**:
   ```bash
   ai-workspace --version
   cd /path/to/your-repo
   ai-workspace init
   ```
   For the richest setup, run the `/configure` skill inside the editor and let the AI propose your config.

## Option B — Expert / from source

```bash
git clone https://github.com/grojof/ai-workspace-generator.git
cd ai-workspace-generator
npm install && npm run build && npm link
ai-workspace --version
```

## Update

- **Tarball install:** re-run the Option A install command — the `releases/latest/download/…` URL always points
  at the newest Release.
- **From source:** `git pull && npm run build` (a re-`npm link` is only needed if the bin path changed).

## Maintainer — cut a release

```bash
npm run release            # build + npm pack + print the `gh release create` command (does NOT publish)
npm run release -- --publish   # build + pack + create the GitHub Release (needs an authenticated gh)
```

The release attaches a versioned tarball plus a stable `ai-workspace-generator.tgz` that powers the
`releases/latest/download/` URL used above. Publishing is outward-facing — a deliberate, opt-in step.
