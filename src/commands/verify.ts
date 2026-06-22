import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import { MANIFEST_PATH, fingerprint, type Manifest, type ManifestEntry } from "../generate/manifest.js";
import { TEMPLATES_VERSION } from "../version.js";
import { AIWS } from "../generate/naming.js";

export type VerifyLevel = "error" | "warn";

export interface VerifyFinding {
  level: VerifyLevel;
  path: string;
  message: string;
}

export interface VerifyResult {
  ok: boolean; // false if any error-level finding
  findings: VerifyFinding[];
}

/** Compare one manifest entry against the file on disk. Deletions/drift/marker changes are errors; a stale
 *  source version is a warning (suggests `ai-workspace upgrade`). */
function checkEntry(cwd: string, entry: ManifestEntry): VerifyFinding[] {
  const out: VerifyFinding[] = [];
  const abs = resolve(cwd, entry.path);
  if (!existsSync(abs)) {
    out.push({
      level: "error",
      path: entry.path,
      message: "deleted (base artifact is missing — run `ai-workspace sync`)",
    });
    return out;
  }
  const now = fingerprint(cwd, entry.path);
  if (!now) {
    out.push({
      level: "error",
      path: entry.path,
      message: "no longer a recognizable base artifact (managed markers removed?)",
    });
    return out;
  }
  if (entry.kind === "managed") {
    const before = entry.blocks ?? [];
    const after = now.blocks ?? [];
    const missing = before.filter((b) => !after.includes(b));
    const added = after.filter((b) => !before.includes(b));
    if (missing.length)
      out.push({
        level: "error",
        path: entry.path,
        message: `managed block(s) removed/renamed: ${missing.join(", ")}`,
      });
    if (added.length)
      out.push({
        level: "error",
        path: entry.path,
        message: `unexpected managed block(s): ${added.join(", ")}`,
      });
    if (!missing.length && !added.length && before.join("|") !== after.join("|")) {
      out.push({ level: "error", path: entry.path, message: "managed block order changed" });
    }
  }
  if (now.hash !== entry.hash && out.length === 0) {
    const what = entry.kind === "managed" ? "managed region content edited (in-band)" : "file content edited";
    out.push({ level: "error", path: entry.path, message: what });
  }
  if (entry.source !== `${AIWS}@${TEMPLATES_VERSION}`) {
    out.push({
      level: "warn",
      path: entry.path,
      message: `built by ${entry.source}, current is ${AIWS}@${TEMPLATES_VERSION} — run \`ai-workspace upgrade\``,
    });
  }
  return out;
}

/** Verify base integrity against `.ai-workspace/manifest.json` (ADR 0003 Part E). Pure: no writes. */
export function verify(cwd: string): VerifyResult {
  const manifestPath = resolve(cwd, MANIFEST_PATH);
  if (!existsSync(manifestPath)) {
    throw new Error(`No ${MANIFEST_PATH} found. Run \`ai-workspace sync\` to generate it first.`);
  }
  let manifest: Manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  } catch {
    return {
      ok: false,
      findings: [
        { level: "error", path: MANIFEST_PATH, message: "manifest is not valid JSON (tampered or corrupt)" },
      ],
    };
  }
  const findings: VerifyFinding[] = [];
  for (const entry of manifest.entries) findings.push(...checkEntry(cwd, entry));
  return { ok: !findings.some((f) => f.level === "error"), findings };
}

/** CLI entry: print findings and exit non-zero on any error (CI gate). */
export function runVerify(cwd: string): void {
  const { ok, findings } = verify(cwd);
  console.log(pc.bold("\nIntegrity verification (base artifacts)\n"));
  if (findings.length === 0) {
    console.log(pc.green("  ✔ All base artifacts match the manifest.\n"));
    return;
  }
  for (const f of findings) {
    const tag = f.level === "error" ? pc.red("✖ error") : pc.yellow("⚠ warn ");
    console.log(`  ${tag} ${pc.underline(f.path)} — ${f.message}`);
  }
  const errors = findings.filter((f) => f.level === "error").length;
  const warns = findings.length - errors;
  console.log(`\n  ${errors} error(s), ${warns} warning(s).\n`);
  if (!ok) process.exit(1);
}
