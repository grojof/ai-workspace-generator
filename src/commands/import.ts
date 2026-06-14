import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, relative, basename, join } from "node:path";
import pc from "picocolors";
import { loadConfig, saveConfig, configExists } from "../config/loader.js";
import { writeManaged, writeIfMissing, writeFile } from "../render/writer.js";

type AssetKind = "instructions" | "lint" | "format" | "company" | "tsconfig";

interface Asset {
  abs: string;
  rel: string;
  kind: AssetKind;
}

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);

function classify(name: string): AssetKind | null {
  const lower = name.toLowerCase();
  if (
    lower === "agents.md" ||
    lower === "claude.md" ||
    lower === ".cursorrules" ||
    lower === "copilot-instructions.md" ||
    lower.endsWith(".instructions.md")
  ) {
    return "instructions";
  }
  if (/^\.eslintrc|eslint\.config\.|^\.prettierrc|prettier\.config\./.test(lower)) return "lint";
  if (lower === ".editorconfig") return "format";
  if (lower === "tsconfig.json") return "tsconfig";
  if (/(contributing|styleguide|conventions|coding-standards)/.test(lower) && lower.endsWith(".md")) {
    return "company";
  }
  return null;
}

function walk(dir: string, root: string, acc: Asset[], depth = 0): void {
  if (depth > 6) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!IGNORE_DIRS.has(name)) walk(abs, root, acc, depth + 1);
    } else {
      const kind = classify(name);
      if (kind) acc.push({ abs, rel: relative(root, abs).split("\\").join("/"), kind });
    }
  }
}

/**
 * Ingest existing company assets from one or more source folders. Deterministic
 * part runs in the CLI; reconciliation against current best practices is left as
 * a context7 checklist for the AI (the CLI can't query MCP servers).
 */
export function runImport(cwd: string, sources: string[]): void {
  if (!configExists(cwd)) {
    throw new Error("No workspace.config.yaml found. Run `ai-workspace init` first.");
  }
  const config = loadConfig(cwd);

  const assets: Asset[] = [];
  for (const src of sources) {
    const abs = resolve(cwd, src);
    if (!existsSync(abs)) {
      console.log(pc.yellow(`Source not found, skipping: ${src}`));
      continue;
    }
    walk(abs, abs, assets);
  }

  if (assets.length === 0) {
    console.log(pc.yellow("No recognizable assets found (instructions, linters, style guides)."));
    return;
  }

  const byKind = (k: AssetKind) => assets.filter((a) => a.kind === k);

  // 1. Copy instruction & style assets into the repo (non-destructive) for review.
  const copied: string[] = [];
  for (const a of [...byKind("instructions"), ...byKind("company")]) {
    const dest = resolve(cwd, "docs/ai/imported", basename(a.rel));
    const r = writeIfMissing(dest, readFileSync(a.abs, "utf8"));
    if (r.status !== "unchanged") copied.push(`docs/ai/imported/${basename(a.rel)}`);
  }

  // 2. Copy lint/format/tsconfig configs only if the repo lacks them.
  for (const a of [...byKind("lint"), ...byKind("format"), ...byKind("tsconfig")]) {
    writeIfMissing(resolve(cwd, basename(a.rel)), readFileSync(a.abs, "utf8"));
  }

  // 3. Reference block in AGENTS.md (managed; persists across syncs).
  const refLines = [
    "## Imported standards (Layer 3 source · review with context7)",
    "",
    "Imported from existing company assets. **Company/business rules take precedence**; the items",
    "below were brought in and must be reconciled against current best practices.",
    "",
    ...copied.map((c) => `- \`${c}\``),
    "",
    "> See `docs/ai/INGEST-RECONCILE.md` for the reconciliation checklist.",
  ].join("\n");
  writeManaged(resolve(cwd, "AGENTS.md"), "html", [{ id: "imported", content: refLines }]);

  // 4. Reconciliation checklist for the AI (context7).
  const checklist = [
    "# Ingestion reconciliation checklist",
    "",
    "The generator imported the assets below. Verify each against current best practices using the",
    "**context7** MCP for the pinned versions in `workspace.config.yaml`. Company/business rules win on conflict;",
    "only annotate outdated practices — do not silently rewrite organization decisions.",
    "",
    "## Imported assets",
    ...assets.map((a) => `- [ ] (${a.kind}) ${a.rel}`),
    "",
    "## How to reconcile",
    config.ingest.reconcileWithContext7
      ? "1. For each imported practice, query context7 for the relevant library@version.\n2. Mark items that are outdated/deprecated and note the current recommendation.\n3. Update the base layers (0–2) where safe; leave company/business (3–4) intact unless explicitly approved."
      : "Reconciliation with context7 is disabled in config (`ingest.reconcileWithContext7: false`).",
  ].join("\n");
  writeFile(resolve(cwd, "docs/ai/INGEST-RECONCILE.md"), checklist);

  // 5. Record provenance in config.
  const merged = Array.from(new Set([...config.ingest.sources, ...sources]));
  config.ingest.sources = merged;
  saveConfig(cwd, config);

  console.log(pc.bold(`\nIngested ${assets.length} asset(s) from: ${sources.join(", ")}\n`));
  console.log(`  ${pc.green("•")} ${byKind("instructions").length} instruction file(s)`);
  console.log(`  ${pc.green("•")} ${byKind("company").length} style/convention doc(s)`);
  console.log(`  ${pc.green("•")} ${byKind("lint").length + byKind("format").length + byKind("tsconfig").length} config file(s)`);
  console.log(
    pc.dim(
      "\n  Wrote AGENTS.md `imported` block, docs/ai/imported/*, and docs/ai/INGEST-RECONCILE.md.\n" +
        "  Next: have the AI run the reconciliation checklist with context7.\n",
    ),
  );
}
