import test from "node:test";
import assert from "node:assert/strict";
import { extractLocalLinks } from "../dist/util/links.js";

// 0016a: `extractLocalLinks` feeds the doc-coherence checks. It must catch relative file links and ignore
// URLs, scheme links and pure anchors, stripping any `#fragment` or `"title"` suffix.

test("links · extracts relative file targets, ignores URLs / anchors / scheme links", () => {
  const md = [
    "See [a](./guide.md) and [b](../docs/x.md).",
    "[ext](https://example.com) [mail](mailto:x@y.z) [anchor](#section) [proto](file:///etc).",
    '[titled](path/to/file.md "a title") and [frag](page.md#heading).',
  ].join("\n");
  const links = extractLocalLinks(md);
  assert.deepEqual([...links].sort(), ["../docs/x.md", "./guide.md", "page.md", "path/to/file.md"].sort());
  assert.ok(!links.includes("https://example.com"));
  assert.ok(!links.includes("#section"));
});

test("links · de-duplicates and returns [] for link-free content", () => {
  assert.deepEqual(extractLocalLinks("plain text, `code`, no links"), []);
  assert.deepEqual(extractLocalLinks("[x](a.md) again [y](a.md)"), ["a.md"]);
});
