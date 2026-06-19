/**
 * Rough token estimate. A precise count needs the model tokenizer, but a
 * chars/4 heuristic is good enough to flag bloated instruction files in `doctor`
 * and to keep AGENTS.md lean.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
