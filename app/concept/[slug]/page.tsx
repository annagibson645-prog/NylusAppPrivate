import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { VaultNode } from "@/lib/types";
import { shardFile } from "@/lib/shard";
import NodeReader from "@/components/NodeReader";

export const dynamic = 'force-dynamic';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

/** The fields needed to render a link *to* a node. See cards.json in build-vault.ts. */
type Card = { title: string; type: string; color: string; domain: string };
type OrderEntry = { id: string; title: string; excerpt: string };
type HubNav = { id: string; title: string; concepts: OrderEntry[] };

export default async function ConceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  // ?hub= carries the hub you are actually reading. It matters because a
  // concept can sit in several hubs' lists while its own `hub` field names only
  // one of them — 663 concepts do. Without this, clicking one of those from hub
  // A would hand you hub B's sequence and quietly drop you out of the list you
  // were working through.
  const sp = await searchParams;
  const fromHub = typeof sp.hub === "string" ? sp.hub : undefined;

  // This route used to read graph.json (20MB) plus the node's whole domain file
  // (up to 50MB) on every request to render one ~17KB note. cards.json + one
  // body shard + the domain's order file cover the same ground in ~2MB.

  // cards.json is the existence check graph.json used to provide: a slug that
  // isn't listed has no node behind it, so 404 exactly as before.
  const cards = loadJSON<Record<string, Card>>("cards.json");
  if (!cards[slug]) notFound();

  // If cards.json lists the slug but its shard doesn't hold it, the generated
  // data is internally inconsistent. Fail loudly: the previous version caught
  // this and rendered the page with an empty body, so a broken data path
  // surfaced as silently missing text with nothing in the logs.
  const bodies = loadJSON<Record<string, VaultNode>>(shardFile(slug));
  const node = bodies[slug];
  if (!node) {
    throw new Error(
      `"${slug}" is listed in cards.json but missing from ${shardFile(slug)} — regenerate with "npm run parse"`
    );
  }

  const nodeTypes = new Map(Object.entries(cards).map(([id, c]) => [id, c.type]));
  const backlinkedNodes = node.backlinks.flatMap((id) =>
    cards[id] ? [{ id, ...cards[id] } as unknown as VaultNode] : []
  );

  // Reading order. The hub a concept belongs to is the sequence the reader was
  // actually following, so it takes precedence over the domain order — walking
  // "next" should carry you through the hub you entered from, not through every
  // concept in Eastern Spirituality. hubnav-[hub].json holds that sequence in
  // the same order the hub's own rail reads it.
  //
  // Not every concept resolves: a few dozen carry a hub id with no hub file
  // behind it, and a handful have no hub at all. Those fall back to the domain
  // order, which is what every concept used before.
  // The hub you arrived from wins; the concept's own hub is the fallback for
  // direct visits (search, a bare link, a bookmark).
  let hubNav: HubNav | null = null;
  let hubIdx = -1;
  for (const candidate of [fromHub, node.hub]) {
    if (!candidate) continue;
    const safeHub = candidate.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    let nav: HubNav;
    try {
      nav = loadJSON<HubNav>(`hubnav-${safeHub}.json`);
    } catch {
      continue; // hub id with no hub file behind it — try the next candidate
    }
    const i = nav.concepts.findIndex(c => c.id === slug);
    if (i >= 0) { hubNav = nav; hubIdx = i; break; }
  }
  const inHub = hubIdx >= 0;

  let siblings: OrderEntry[];
  let nextEntry: OrderEntry | undefined;

  if (inHub && hubNav) {
    // Stop at the end of a hub rather than wrapping: the hub panel's own arrows
    // disable there, and silently looping back to the first concept reads as a
    // bug. NodeReader shows an end-of-hub card instead.
    nextEntry = hubNav.concepts[hubIdx + 1];
    // Window the rail around where you are, and keep the current concept in it
    // so it can render as "you are here".
    const W = 15;
    const start = Math.min(
      Math.max(0, hubIdx - Math.floor(W / 2)),
      Math.max(0, hubNav.concepts.length - W)
    );
    siblings = hubNav.concepts.slice(start, start + W);
  } else {
    const safeDomain = (node.domain || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const sectionOrder = loadJSON<OrderEntry[]>(`order-${safeDomain}.json`);
    const here = sectionOrder.findIndex(n => n.id === slug);
    // Wraps at the end so the last concept still points somewhere.
    nextEntry = sectionOrder.length > 1
      ? sectionOrder[(here + 1) % sectionOrder.length]
      : undefined;
    siblings = sectionOrder.filter(n => n.id !== slug).slice(0, 15);
  }

  return (
    <NodeReader
      node={node}
      backlinkedNodes={backlinkedNodes}
      nodeTypes={nodeTypes}
      domainSiblings={siblings as unknown as VaultNode[]}
      nextNode={nextEntry as unknown as VaultNode | undefined}
      hubNav={
        inHub && hubNav
          ? {
              id: hubNav.id,
              title: hubNav.title,
              index: hubIdx,
              total: hubNav.concepts.length,
            }
          : undefined
      }
    />
  );
}
