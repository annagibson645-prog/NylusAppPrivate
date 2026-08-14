// lib/hubnav.ts
// Turning a hub's concept sequence into what a concept page shows: which
// entries the rail lists, what "next" points at, and where you are in the hub.
//
// Two callers need to agree. The concept page computes this while building the
// page, and NodeReader recomputes it in the browser when ?hub= names a hub
// other than the one the page was built for — a page prerendered at build time
// cannot read the query string, so the correction happens after load. If the
// two disagreed, that correction would visibly reshuffle the rail.

export type HubEntry = { id: string; title: string; excerpt: string };
export type HubNavFile = { id: string; title: string; concepts: HubEntry[] };

/** Rail entries shown around the current concept, current one included. */
export const RAIL_WINDOW = 15;

export type HubPosition = {
  index: number;
  total: number;
  /** Undefined at the end of a hub — the caller shows an end-of-hub card. */
  next?: HubEntry;
  siblings: HubEntry[];
};

/** Where `slug` sits in this hub, or null if the hub does not contain it. */
export function hubPosition(nav: HubNavFile, slug: string): HubPosition | null {
  const index = nav.concepts.findIndex((c) => c.id === slug);
  if (index < 0) return null;

  // Keep the current concept inside the window so it can render as "you are
  // here", and stop sliding once the window reaches the end of the hub.
  const start = Math.min(
    Math.max(0, index - Math.floor(RAIL_WINDOW / 2)),
    Math.max(0, nav.concepts.length - RAIL_WINDOW)
  );

  return {
    index,
    total: nav.concepts.length,
    next: nav.concepts[index + 1],
    siblings: nav.concepts.slice(start, start + RAIL_WINDOW),
  };
}

/** Hub slug → the file holding its order. Shared so both sides build it alike. */
export function hubNavFile(hubId: string): string {
  return `hubnav-${hubId.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.json`;
}
