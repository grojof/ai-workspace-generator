import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { CLI_VERSION } from "../dist/version.js";

// The release tarball is named from package.json.version; `ai-workspace --version` reports CLI_VERSION.
// They MUST match so the artifact name and the reported version never drift.
test("CLI_VERSION matches package.json.version (single-sourced release version)", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(CLI_VERSION, pkg.version);
});
