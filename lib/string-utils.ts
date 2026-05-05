// Safe text truncation and manipulation utilities

/**
 * Truncate text at maxChars, respecting word boundaries.
 * If text is shorter than maxChars, returns as-is.
 * Otherwise finds the last space before maxChars and truncates there.
 *
 * Note: The ellipsis is added after truncation. If ellipsis length
 * exceeds maxChars, the function reserves space for it (output may
 * be slightly longer than maxChars in edge cases, e.g. 1-2 char limits).
 *
 * @param text - Input text
 * @param maxChars - Target maximum character length (soft limit)
 * @param ellipsis - Suffix to add if truncated (default: "…")
 * @returns Truncated text with ellipsis if needed
 *
 * Examples:
 *   truncateAtWord("Hello world", 5) → "Hello"
 *   truncateAtWord("Hello world", 8) → "Hello"
 *   truncateAtWord("Hello world", 12) → "Hello world" (no truncation)
 */
export function truncateAtWord(
  text: string,
  maxChars: number,
  ellipsis: string = "…"
): string {
  if (!text || maxChars <= 0) return "";
  if (text.length <= maxChars) return text;

  // Ensure maxChars is at least as long as ellipsis
  const availableChars = Math.max(1, maxChars - ellipsis.length);

  // Find last space before availableChars
  const truncated = text.slice(0, availableChars);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + ellipsis;
  }

  // No space found, hard truncate with available space
  return truncated.slice(0, availableChars) + ellipsis;
}

/**
 * Clean title by removing common prefixes and redundant formatting.
 *
 * @param title - Raw title string
 * @returns Cleaned title
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/^Collision:\s*/i, "")
    .replace(/^Spark:\s*/i, "")
    .trim();
}
