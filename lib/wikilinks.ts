// lib/wikilinks.ts
// How a [[wikilink]] in note body text becomes a node slug.
//
// This lives in one place because two callers depend on agreeing exactly:
// app/concept/[slug]/page.tsx decides *which* node types to send to the
// browser, and NodeReader decides which links to render as live. If the page
// resolved a target the renderer didn't (or vice versa), real links would
// quietly render as plain "broken" text with nothing to explain why.

const FRONTMATTER = /^---[\s\S]*?---\n?/;

/** `[[target]]` and `[[target|alias]]`; `#`-anchors and newlines end a target. */
const WIKILINK_SOURCE = String.raw`\[\[([^\]|#\n]+?)(?:\|([^\]\n]+))?\]\]`;

/** Fresh each call — a shared /g regex carries lastIndex between callers. */
export function wikilinkPattern(): RegExp {
  return new RegExp(WIKILINK_SOURCE, "g");
}

export function slugFromWikilink(target: string): string {
  return target
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Every slug a note's body links to, de-duplicated. Frontmatter is stripped
 * first so this sees exactly the text NodeReader will render.
 */
export function wikilinkSlugs(raw: string): Set<string> {
  const body = (raw || "").replace(FRONTMATTER, "");
  const found = new Set<string>();
  for (const m of body.matchAll(wikilinkPattern())) {
    found.add(slugFromWikilink(m[1]));
  }
  return found;
}
