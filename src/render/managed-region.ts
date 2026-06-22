/**
 * Managed regions let the generator own a block of a file while preserving any
 * text the user adds outside the markers. Re-running `sync` only rewrites the
 * inner content of each managed block, never the user's surrounding edits.
 */

export type CommentStyle = "html" | "hash";

const MARKER = "ai-workspace";

interface Markers {
  begin: string;
  end: string;
}

function markers(style: CommentStyle, id: string): Markers {
  if (style === "hash") {
    return {
      begin: `# >>> ${MARKER}:begin:${id}`,
      end: `# <<< ${MARKER}:end:${id}`,
    };
  }
  return {
    begin: `<!-- ${MARKER}:begin:${id} -->`,
    end: `<!-- ${MARKER}:end:${id} -->`,
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap content in begin/end markers for a managed block. */
export function wrapBlock(style: CommentStyle, id: string, content: string): string {
  const { begin, end } = markers(style, id);
  return `${begin}\n${content.trimEnd()}\n${end}`;
}

/**
 * Insert or replace a managed block inside `existing`. If the block exists, its
 * inner content is replaced; otherwise the block is appended. Content outside
 * any managed block is left untouched.
 */
export function upsertBlock(existing: string, style: CommentStyle, id: string, content: string): string {
  const { begin, end } = markers(style, id);
  const block = wrapBlock(style, id, content);
  const re = new RegExp(`${escapeRegExp(begin)}[\\s\\S]*?${escapeRegExp(end)}`, "m");
  if (re.test(existing)) {
    return existing.replace(re, block);
  }
  const base = existing.trimEnd();
  return base.length > 0 ? `${base}\n\n${block}\n` : `${block}\n`;
}

/** Remove a managed block (and its surrounding blank lines) if present. */
export function removeBlock(existing: string, style: CommentStyle, id: string): string {
  const { begin, end } = markers(style, id);
  const re = new RegExp(`\\n*${escapeRegExp(begin)}[\\s\\S]*?${escapeRegExp(end)}\\n*`, "m");
  return existing.replace(re, "\n");
}

/** Apply several managed blocks in order, preserving user content between them. */
export function upsertBlocks(
  existing: string,
  style: CommentStyle,
  blocks: Array<{ id: string; content: string }>,
): string {
  return blocks.reduce((acc, b) => upsertBlock(acc, style, b.id, b.content), existing);
}
