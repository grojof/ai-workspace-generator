import pc from "picocolors";

/**
 * Minimal line-level diff for previewing changes. Not a true LCS diff — it walks
 * both sides and reports added/removed lines, which is enough for `upgrade --check`.
 */
export function lineDiff(before: string, after: string): string {
  const a = before.split("\n");
  const b = after.split("\n");
  const out: string[] = [];
  const max = Math.max(a.length, b.length);
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    // Look ahead a few lines to resync.
    const aNext = b[j] !== undefined ? a.indexOf(b[j], i) : -1;
    const bNext = a[i] !== undefined ? b.indexOf(a[i], j) : -1;
    if (aNext !== -1 && (bNext === -1 || aNext - i <= bNext - j)) {
      while (i < aNext) out.push(pc.red(`- ${a[i++]}`));
    } else if (bNext !== -1) {
      while (j < bNext) out.push(pc.green(`+ ${b[j++]}`));
    } else {
      if (i < a.length) out.push(pc.red(`- ${a[i++]}`));
      if (j < b.length) out.push(pc.green(`+ ${b[j++]}`));
    }
    if (out.length > 200) {
      out.push(pc.dim("  … (diff truncated)"));
      break;
    }
  }
  void max;
  return out.join("\n");
}
