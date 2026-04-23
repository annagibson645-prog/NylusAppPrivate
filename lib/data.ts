import type { VaultNode, GraphData, SearchItem, TimelineEntry, VaultStats } from "./types";

const BASE = "/data";

async function fetchJSON<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getGraph = () => fetchJSON<GraphData>("graph.json");
export const getCollisions = () => fetchJSON<VaultNode[]>("collisions.json");
export const getSparks = () => fetchJSON<VaultNode[]>("sparks.json");
export const getSearchIndex = () => fetchJSON<SearchItem[]>("search-index.json");
export const getTimeline = () => fetchJSON<TimelineEntry[]>("timeline.json");
export const getStats = () => fetchJSON<VaultStats>("stats.json");
export const getDomainNodes = (domain: string) =>
  fetchJSON<VaultNode[]>(`domain-${domain}.json`);

export async function getNodeById(id: string): Promise<VaultNode | null> {
  const { nodes } = await getGraph();
  return nodes.find((n) => n.id === id) ?? null;
}

export async function getNodesByIds(ids: string[]): Promise<VaultNode[]> {
  const { nodes } = await getGraph();
  const map = new Map(nodes.map((n) => [n.id, n]));
  return ids.flatMap((id) => (map.has(id) ? [map.get(id)!] : []));
}
