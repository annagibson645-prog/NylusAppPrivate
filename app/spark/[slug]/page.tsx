import { idsOfType, loadVaultJSON } from "@/lib/vault-json";
import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import NodeReader from "@/components/NodeReader";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return idsOfType("spark").map((slug) => ({ slug }));
}

function loadJSON<T>(file: string): T {
  return loadVaultJSON<T>(file);
}


export default async function SparkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { nodes } = loadJSON<GraphData>("graph.json");
  const slimNode = nodes.find((n) => n.id === slug && n.type === "spark");
  if (!slimNode) notFound();

  // graph.json is content-free — read the spark body from sparks.json.
  const sparks = loadJSON<VaultNode[]>("sparks.json");
  const content = sparks.find((n) => n.id === slug)?.content ?? "";
  const node: VaultNode = { ...slimNode, content };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeTypes = new Map(nodes.map((n) => [n.id, n.type]));
  const backlinkedNodes = node.backlinks.flatMap((id) => nodeMap.has(id) ? [nodeMap.get(id)!] : []);

  return <NodeReader node={node} backlinkedNodes={backlinkedNodes} nodeTypes={nodeTypes} />;
}
