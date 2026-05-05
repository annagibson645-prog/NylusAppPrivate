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
  const node = nodes.find((n) => n.id === slug);
  if (!node) notFound();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeTypes = new Map(nodes.map((n) => [n.id, n.type]));
  const backlinkedNodes = node.backlinks.flatMap((id) => nodeMap.has(id) ? [nodeMap.get(id)!] : []);

  const domainSiblings = nodes
    .filter(n => n.domain === node.domain && n.id !== slug && n.type === 'concept')
    .sort((a, b) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0))
    .slice(0, 15);

  return <NodeReader node={node} backlinkedNodes={backlinkedNodes} nodeTypes={nodeTypes} domainSiblings={domainSiblings} />;
}
