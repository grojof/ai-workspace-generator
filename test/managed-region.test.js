import test from "node:test";
import assert from "node:assert/strict";
import { upsertBlock } from "../dist/render/managed-region.js";

test("creates a managed block when absent", () => {
  const out = upsertBlock("", "html", "core", "hello");
  assert.match(out, /<!-- ai-workspace:begin:core -->/);
  assert.match(out, /hello/);
  assert.match(out, /<!-- ai-workspace:end:core -->/);
});

test("replaces inner content but preserves text outside the markers", () => {
  const first = upsertBlock("# Title\n\nuser note\n", "html", "core", "v1");
  const second = upsertBlock(first, "html", "core", "v2");
  assert.match(second, /v2/);
  assert.doesNotMatch(second, /v1/);
  assert.match(second, /user note/); // outside content survives
  assert.match(second, /# Title/);
});

test("is idempotent for identical content", () => {
  const a = upsertBlock("", "html", "core", "same");
  const b = upsertBlock(a, "html", "core", "same");
  assert.equal(a, b); // re-applying identical content changes nothing
  const count = (b.match(/ai-workspace:begin:core/g) || []).length;
  assert.equal(count, 1); // and never duplicates the block
});

test("hash style uses # markers", () => {
  const out = upsertBlock("", "hash", "ignore", "dist");
  assert.match(out, /# >>> ai-workspace:begin:ignore/);
  assert.match(out, /# <<< ai-workspace:end:ignore/);
});
