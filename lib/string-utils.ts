// Safe text truncation and manipulation utilities

/**
 * Truncate text at maxChars, respecting word boundaries.
 * If text is shorter than maxChars, returns as-is.
 * Otherwise finds the last space before maxChars and truncates there.
 *
 * @param text - Input text
 * @param maxChars - Maximum character length
 * @param ellipsis - Suffix to add if truncated (default: "…")
 * @returns Truncated text
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

  // Find last space before maxChars
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + ellipsis;
  }

  // No space found, hard truncate
  return truncated.slice(0, Math.max(1, maxChars - ellipsis.length)) + ellipsis;
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
