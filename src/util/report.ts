import pc from "picocolors";
import type { Artifact } from "../generate/index.js";

const ICON = {
  created: pc.green("+"),
  updated: pc.yellow("~"),
  unchanged: pc.dim("="),
} as const;

export function printArtifacts(artifacts: Artifact[]): void {
  for (const a of artifacts) {
    const icon = ICON[a.status];
    const path = a.status === "unchanged" ? pc.dim(a.path) : a.path;
    console.log(`  ${icon} ${path}`);
  }
  const created = artifacts.filter((a) => a.status === "created").length;
  const updated = artifacts.filter((a) => a.status === "updated").length;
  const unchanged = artifacts.filter((a) => a.status === "unchanged").length;
  console.log(
    pc.dim(`\n  ${created} created, ${updated} updated, ${unchanged} unchanged`),
  );
}
