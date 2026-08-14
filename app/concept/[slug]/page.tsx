import { notFound } from "next/navigation";
import type { VaultNode } from "@/lib/types";
import { loadVaultJSON } from "@/lib/vault-json";
import { shardFile } from "@/lib/shard";
import { wikilinkSlugs } from "@/lib/wikilinks";
import { hubNavFile, hubPosition, type HubNavFile } from "@/lib/hubnav";
import NodeReader from "@/components/NodeReader";

/**
 * Prerendered. These pages were rendered per request, which meant Vercel packed
 * every note body into this route's serverless function — 207MB against a
 * 250MB limit, growing with the vault, and failing the whole deploy on the day
 * it crossed. A static page produces no function at all, so that ceiling stops
 * applying rather than merely receding.
 *
 * Nothing here was ever request-specific: the data only changes when
 * `npm run parse` regenerates it and the site rebuilds.
 */
export const dynamic = "force-static";
/** Everything is generated below, so an unknown slug is a real 404, not a
 *  reason to keep a function around to render it on demand. */
export const dynamicParams = false;

/** The memoized reader matters here: without it cards.json would be parsed
 *  once per page instead of once per build worker. */
function loadJSON<T>(file: string): T {
  return loadVaultJSON<T>(file);
}

/** The fields needed to render a link *to* a node. See cards.json in build-vault.ts. */
type Card = { title: string; type: string; color: string; domain: string };

export function generateStaticParams() {
  // Every node, not just concepts: NodeReader links a note's outgoing links to
  // /concept/<id> whatever their type, so narrowing this would turn some of
  // those into 404s.
  const cards = loadJSON<Record<string, Card>>("cards.json");
  return Object.keys(cards).map((slug) => ({ slug }));
}

export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // cards.json is the existence check graph.json used to provide: a slug that
  // isn't listed has no node behind it, so 404 exactly as before.
  const cards = loadJSON<Record<string, Card>>("cards.json");
  if (!cards[slug]) notFound();

  // If cards.json lists the slug but its shard doesn't hold it, the generated
  // data is internally inconsistent. Fail loudly: an earlier version caught
  // this and rendered the page with an empty body, so a broken data path
  // surfaced as silently missing text with nothing in the logs.
  const bodies = loadJSON<Record<string, VaultNode>>(shardFile(slug));
  const node = bodies[slug];
  if (!node) {
    throw new Error(
      `"${slug}" is listed in cards.json but missing from ${shardFile(slug)} — regenerate with "npm run parse"`
    );
  }

  // Only the link targets this note actually mentions. NodeReader needs a type
  // per wikilink to route it, and this used to hand it the whole vault — one
  // entry per node, 11,800+ of them, serialized into every single page.
  const nodeTypes = new Map<string, string>();
  for (const id of wikilinkSlugs(node.content)) {
    const card = cards[id];
    if (card) nodeTypes.set(id, card.type);
  }

  const backlinkedNodes = node.backlinks.flatMap((id) =>
    cards[id] ? [{ id, ...cards[id] } as unknown as VaultNode] : []
  );

  // Reading order. A concept's hub is the sequence the reader is following, so
  // it takes precedence over the domain order — walking "next" should carry you
  // through the hub you entered from, not through every concept in the domain.
  //
  // The page is built for the concept's *own* hub. A concept can appear in
  // several hubs' lists, and which one you are reading arrives as ?hub= — but a
  // prerendered page cannot read the query string, so NodeReader applies that
  // correction in the browser. This is right for the 92.5% of cases where they
  // are the same hub, and the rest are fixed up after load.
  let hubNav: HubNavFile | null = null;
  if (node.hub) {
    try {
      hubNav = loadJSON<HubNavFile>(hubNavFile(node.hub));
    } catch {
      hubNav = null; // hub id with no hub file behind it — fall back to domain
    }
  }
  const position = hubNav ? hubPosition(hubNav, slug) : null;

  let siblings;
  let nextEntry;

  if (hubNav && position) {
    // Stop at the end of a hub rather than wrapping: the hub panel's own arrows
    // disable there, and silently looping to the first concept reads as a bug.
    siblings = position.siblings;
    nextEntry = position.next;
  } else {
    const safeDomain = (node.domain || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const sectionOrder = loadJSON<{ id: string; title: string; excerpt: string }[]>(
      `order-${safeDomain}.json`
    );
    const here = sectionOrder.findIndex((n) => n.id === slug);
    // Wraps at the end so the last concept still points somewhere.
    nextEntry = sectionOrder.length > 1
      ? sectionOrder[(here + 1) % sectionOrder.length]
      : undefined;
    siblings = sectionOrder.filter((n) => n.id !== slug).slice(0, 15);
  }

  return (
    <NodeReader
      node={node}
      backlinkedNodes={backlinkedNodes}
      nodeTypes={nodeTypes}
      domainSiblings={siblings as unknown as VaultNode[]}
      nextNode={nextEntry as unknown as VaultNode | undefined}
      hubNav={
        hubNav && position
          ? { id: hubNav.id, title: hubNav.title, index: position.index, total: position.total }
          : undefined
      }
    />
  );
}
