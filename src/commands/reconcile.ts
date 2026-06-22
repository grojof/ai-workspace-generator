import pc from "picocolors";
import { loadCompanyPacks, baseCatalogIds, packRelation } from "../generate/stackPacks.js";
import { verify } from "./verify.js";

/** How a company overlay unit relates to the current base after an upgrade (ADR 0003 Part F). */
export type ReconcileKind = "unique" | "redundant" | "conflict" | "drift";

export interface ReconcileFinding {
  kind: ReconcileKind;
  unit: string; // pack id, or a base path for drift
  message: string;
}

const ICON: Record<ReconcileKind, string> = { unique: "🔵", redundant: "🟢", conflict: "🟡", drift: "⚠️" };

/**
 * Classify each company overlay against the current base catalog, plus surface out-of-band base drift. Pure
 * (no writes) — the `aiws-reconcile` skill turns this into a propose-and-review flow; nothing is auto-edited.
 *
 *  - 🔵 unique     — `relation: new`: an independent company skill → keep.
 *  - 🟢 redundant  — `overrides:<id>` whose target no longer exists in the base → the override is stale; review.
 *  - 🟡 conflict   — `overrides:<id>` of a live base skill → the base may have moved; the user decides.
 *  - ⚠️ drift      — a base artifact edited out of band (from `verify`).
 */
export function reconcile(cwd: string): ReconcileFinding[] {
  const out: ReconcileFinding[] = [];
  const base = baseCatalogIds();
  const resolves = (target: string): boolean => base.has(target) || (base.has("aiws-sdd-*") && target.startsWith("aiws-sdd-"));

  for (const { manifest } of loadCompanyPacks(cwd)) {
    const r = packRelation(manifest);
    if (r.kind === "new") {
      out.push({ kind: "unique", unit: manifest.id, message: "independent company skill — keep" });
    } else if (r.kind === "extends") {
      out.push({ kind: "unique", unit: manifest.id, message: "extends the base catalog — keep (review against new base)" });
    } else if (r.kind === "overrides" && r.target) {
      if (resolves(r.target)) {
        out.push({ kind: "conflict", unit: manifest.id, message: `overrides \`${r.target}\` — compare against the current base version; you decide` });
      } else {
        out.push({ kind: "redundant", unit: manifest.id, message: `overrides \`${r.target}\`, which is no longer in the base — stale; review/remove` });
      }
    }
  }

  // Out-of-band base drift is exactly what `verify` reports (when a manifest exists).
  try {
    for (const f of verify(cwd).findings) {
      if (f.level === "error") out.push({ kind: "drift", unit: f.path, message: f.message });
    }
  } catch {
    /* no manifest yet — skip drift */
  }

  return out;
}

/** CLI entry: print the classification. Read-only; proposing/applying is the `aiws-reconcile` skill's job. */
export function runReconcile(cwd: string): void {
  const findings = reconcile(cwd);
  console.log(pc.bold("\nReconcile — company overlay vs base\n"));
  if (findings.length === 0) {
    console.log(pc.green("  ✔ No company overlays and no base drift. Nothing to reconcile.\n"));
    return;
  }
  for (const f of findings) {
    console.log(`  ${ICON[f.kind]} ${pc.bold(f.kind.padEnd(9))} ${pc.underline(f.unit)} — ${f.message}`);
  }
  const n = (k: ReconcileKind) => findings.filter((f) => f.kind === k).length;
  console.log(
    pc.dim(`\n  🔵 ${n("unique")} unique · 🟢 ${n("redundant")} redundant · 🟡 ${n("conflict")} conflict · ⚠️ ${n("drift")} drift`),
  );
  console.log(pc.yellow("\n  Review with the `aiws-reconcile` skill — it proposes changes for your approval; nothing is auto-applied.\n"));
}
