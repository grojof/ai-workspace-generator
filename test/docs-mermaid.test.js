import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

// Mermaid node labels that contain special characters must be wrapped in double quotes, or GitHub's
// renderer fails intermittently (the `translate(undefined, NaN)` error). This guards the convention
// across the human-authored docs (README + docs/), which `sync` does not regenerate.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function mdFiles() {
  const out = [];
  for (const f of ["README.md", "README.es.md"]) {
    try {
      statSync(join(root, f));
      out.push(join(root, f));
    } catch {
      /* not present */
    }
  }
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".md")) out.push(p);
    }
  };
  walk(join(root, "docs"));
  return out;
}

// Capture a node label and whether it opens with a double quote. Handles the common shapes:
// [text] (text) {text} ([text]) [(text)] [[text]].
const labelRe = /(?:\[\(|\(\[|\[\[|\[|\(|\{)("?)([^\[\](){}\n]*?)\1?(?:\)\]|\]\)|\]\]|\]|\)|\})/g;

// Characters that are unsafe unquoted inside a Mermaid label.
function needsQuotes(inner) {
  return inner.includes("<br/>") || inner.includes("·");
}

function offendersIn(content) {
  const bad = [];
  const blockRe = /```mermaid\n([\s\S]*?)```/g;
  let block;
  while ((block = blockRe.exec(content))) {
    labelRe.lastIndex = 0;
    let label;
    while ((label = labelRe.exec(block[1]))) {
      const quoted = label[1] === '"';
      if (!quoted && needsQuotes(label[2])) bad.push(label[2].trim());
    }
  }
  return bad;
}

test("docs Mermaid node labels quote special characters", () => {
  const failures = [];
  for (const file of mdFiles()) {
    const bad = offendersIn(readFileSync(file, "utf8"));
    if (bad.length) failures.push(`${relative(root, file)} → ${bad.map((b) => `[${b}]`).join(", ")}`);
  }
  assert.equal(
    failures.length,
    0,
    `Unquoted Mermaid labels with special characters (wrap them in double quotes):\n${failures.join("\n")}`,
  );
});
