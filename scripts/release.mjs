#!/usr/bin/env node
/**
 * Local release helper — build + `npm pack` a runnable tarball, then (by default) PRINT the exact
 * `gh release create` command without running it. Creating a GitHub Release is outward-facing (Safety gate),
 * so publishing only happens with the explicit `--publish` flag.
 *
 * Usage:
 *   node scripts/release.mjs            # build + pack + print the gh command (no publish)
 *   node scripts/release.mjs --publish  # build + pack + create the GitHub Release (requires authenticated gh)
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const tarball = `${pkg.name}-${version}.tgz`; // versioned, for provenance
const latest = `${pkg.name}.tgz`; // stable name, powers the `releases/latest/download/` URL
const publish = process.argv.includes("--publish");

/** Run a command inheriting stdio so build/pack output is visible; throw on failure. */
function run(cmd, args) {
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
}

console.log(`\n• Releasing ${pkg.name} ${tag}\n`);

run("npm", ["run", "build"]);
run("npm", ["pack"]); // → <name>-<version>.tgz in the repo root (contains dist/ + templates/ + skill-packs/)
copyFileSync(resolve(root, tarball), resolve(root, latest)); // stable-named copy for the latest-download URL

const url = `https://github.com/grojof/ai-workspace-generator/releases/latest/download/${latest}`;
const notes = `Prebuilt tarball for ${tag}. Needs Node ≥ 20. Install:\n\n    npm i -g ${url}\n\n(or download ${tarball} and run \`npm i -g ./${tarball}\`).`;

if (!publish) {
  console.log(`\n✔ Built ${tarball} (+ stable ${latest}). Nothing was published (Safety gate).`);
  console.log(`\nTo create the GitHub Release, review and run:\n`);
  console.log(`  gh release create ${tag} ${tarball} ${latest} \\`);
  console.log(`    --title "${tag}" \\`);
  console.log(`    --notes ${JSON.stringify(notes)}\n`);
  console.log(`Or re-run with --publish to do it now.\n`);
  process.exit(0);
}

console.log(`\n• Publishing GitHub Release ${tag} …\n`);
run("gh", ["release", "create", tag, tarball, latest, "--title", tag, "--notes", notes]);
console.log(`\n✔ Release ${tag} created with ${tarball} + ${latest}.\n`);
