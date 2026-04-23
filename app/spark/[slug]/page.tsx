import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import NodeReader from "@/components/NodeReader";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export async function generateStaticParams() {
  const { nodes } = loadJSON<GraphData>("graph.json");
  return nodes.filter((n) => n.type === "spark").map((n) => ({ slug: n.id }));
}

export default async function SparkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { nodes } = loadJSON<GraphData>("graph.json");
  const node = nodes.find((n) => n.id === slug && n.type === "spark");
  if (!node) notFound();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const allIds = new Set(nodes.map((n) => n.id));
  const backlinkedNodes = node.backlinks.flatMap((id) => nodeMap.has(id) ? [nodeMap.get(id)!] : []);

  return <NodeReader node={node} backlinkedNodes={backlinkedNodes} allIds={allIds} />;
}
