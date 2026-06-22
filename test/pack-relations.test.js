import test from "node:test";
import assert from "node:assert/strict";
import { parsePackManifest, packRelation, assertRelationsResolve, loadPacks } from "../dist/generate/stackPacks.js";

// ADR 0003 F2b: a company pack declares how it relates to the base via `pack.yaml`'s `relation` field —
// the auditable primitive `aiws-reconcile` reads. Format is validated by the schema; `overrides:` target
// existence is checked against the live base catalog at load.

const base = { id: "corp-acme-thing" };

test("relation · defaults to new; parses extends and overrides", () => {
  assert.deepEqual(packRelation(parsePackManifest({ ...base })), { kind: "new" });
  assert.deepEqual(packRelation(parsePackManifest({ ...base, relation: "new" })), { kind: "new" });
  assert.deepEqual(packRelation(parsePackManifest({ ...base, relation: "extends" })), { kind: "extends" });
  assert.deepEqual(packRelation(parsePackManifest({ ...base, relation: "overrides:aiws-secure-commit" })), {
    kind: "overrides",
    target: "aiws-secure-commit",
  });
});

test("relation · schema rejects malformed values and non-reserved override targets", () => {
  // Not one of the three shapes.
  assert.throws(() => parsePackManifest({ ...base, relation: "bogus" }), /relation must be/);
  // overrides with no target.
  assert.throws(() => parsePackManifest({ ...base, relation: "overrides:" }), /relation must be/);
  // overrides a non-reserved (non-aiws) id — only base skills can be overridden.
  assert.throws(() => parsePackManifest({ ...base, relation: "overrides:my-skill" }), /must target a base aiws- id/);
});

test("relation · existence check rejects a dangling override, accepts real base ids + the orchestrator glob", () => {
  const mk = (relation) => ({ manifest: parsePackManifest({ ...base, relation }), dir: "/tmp/x" });
  // Dangling: well-formed aiws- id that names no base skill.
  assert.throws(() => assertRelationsResolve([mk("overrides:aiws-nonexistent")]), /names no base skill/);
  // Real registry skill.
  assert.doesNotThrow(() => assertRelationsResolve([mk("overrides:aiws-secure-commit")]));
  // Orchestrator family resolves against the `aiws-sdd-*` glob.
  assert.doesNotThrow(() => assertRelationsResolve([mk("overrides:aiws-sdd-explore")]));
  // A renamed fusion pack id (F2a) is a real base id too.
  assert.doesNotThrow(() => assertRelationsResolve([mk("overrides:aiws-sdd-spec-schema")]));
  // new/extends are never existence-checked.
  assert.doesNotThrow(() => assertRelationsResolve([mk("new"), mk("extends")]));
});

test("relation · all bundled packs load (default new — no dangling overrides)", () => {
  // loadPacks runs assertRelationsResolve; this throws if any shipped pack has a bad relation.
  const packs = loadPacks();
  assert.ok(packs.length > 0);
  for (const { manifest } of packs) assert.equal(packRelation(manifest).kind, "new");
});
