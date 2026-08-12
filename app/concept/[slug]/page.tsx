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

export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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

  // Reading order for the domain ("section"): most-linked first, title as the
  // tie-break so the sequence is stable between builds. Precomputed into
  // order-[domain].json with that exact sort; it still includes the current
  // node so "next" is just the following entry.
  const safeDomain = (node.domain || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const sectionOrder = loadJSON<OrderEntry[]>(`order-${safeDomain}.json`);

  const here = sectionOrder.findIndex(n => n.id === slug);
  // Wraps at the end so the last concept still points somewhere.
  const nextNode = sectionOrder.length > 1
    ? (sectionOrder[(here + 1) % sectionOrder.length] as unknown as VaultNode)
    : undefined;

  const domainSiblings = sectionOrder
    .filter(n => n.id !== slug)
    .slice(0, 15) as unknown as VaultNode[];

  return (
    <NodeReader
      node={node}
      backlinkedNodes={backlinkedNodes}
      nodeTypes={nodeTypes}
      domainSiblings={domainSiblings}
      nextNode={nextNode}
    />
  );
}
