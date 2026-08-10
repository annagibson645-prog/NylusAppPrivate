import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import NodeReader from "@/components/NodeReader";

export const dynamic = 'force-dynamic';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}


export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { nodes } = loadJSON<GraphData>("graph.json");
  const slimNode = nodes.find((n) => n.id === slug);
  if (!slimNode) notFound();

  // graph.json no longer carries `content` — pull the body from the node's
  // per-domain file (kept under GitHub's size limit by the domain split).
  const safeDomain = (slimNode.domain || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  let content = "";
  try {
    const domainNodes = loadJSON<VaultNode[]>(`domain-${safeDomain}.json`);
    content = domainNodes.find((n) => n.id === slug)?.content ?? "";
  } catch { /* domain file missing — render without body */ }
  const node: VaultNode = { ...slimNode, content };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeTypes = new Map(nodes.map((n) => [n.id, n.type]));
  const backlinkedNodes = node.backlinks.flatMap((id) => nodeMap.has(id) ? [nodeMap.get(id)!] : []);

  // Reading order for the domain ("section"): most-linked first, title as the
  // tie-break so the sequence is stable between builds. Includes the current
  // node so "next" is just the following entry.
  const sectionOrder = nodes
    .filter(n => n.domain === node.domain && n.type === 'concept')
    .sort((a, b) =>
      (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0) ||
      a.title.localeCompare(b.title)
    );

  const here = sectionOrder.findIndex(n => n.id === slug);
  // Wraps at the end so the last concept still points somewhere.
  const nextNode = sectionOrder.length > 1
    ? sectionOrder[(here + 1) % sectionOrder.length]
    : undefined;

  const domainSiblings = sectionOrder.filter(n => n.id !== slug).slice(0, 15);

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
