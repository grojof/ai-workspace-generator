/**
 * Extract workspace-local link targets from Markdown — the inputs to the doc-coherence checks (0016a).
 * Only inline `[text](target)` links are considered; external URLs, mail/tel, and pure `#anchor` links are
 * dropped, and any `#fragment` or `"title"` suffix is stripped so the result is a bare relative path.
 */

const INLINE_LINK = /\]\(\s*([^)\s]+)(?:\s+["'][^)]*["'])?\s*\)/g;

/** True for targets we must not treat as a local file path (URLs, scheme links, pure anchors). */
function isExternalOrAnchor(target: string): boolean {
  return (
    target.startsWith("#") || target.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(target) // http:, https:, mailto:, tel:, file:, etc.
  );
}

/** The de-duplicated set of local (relative) link targets in `content`. */
export function extractLocalLinks(content: string): string[] {
  const out = new Set<string>();
  for (const m of content.matchAll(INLINE_LINK)) {
    let target = m[1].trim();
    if (!target || isExternalOrAnchor(target)) continue;
    const hash = target.indexOf("#");
    if (hash >= 0) target = target.slice(0, hash); // drop in-page fragment
    if (target) out.add(target);
  }
  return [...out];
}
