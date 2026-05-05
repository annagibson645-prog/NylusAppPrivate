import type { VaultNode, GraphData, SearchItem, TimelineEntry, VaultStats } from "./types";

const BASE = "/data";

class DataFetchError extends Error {
  constructor(
    public file: string,
    public status?: number,
    public details?: string
  ) {
    super(
      `Failed to load ${file}${status ? ` (${status})` : ""}${
        details ? `: ${details}` : ""
      }`
    );
    this.name = "DataFetchError";
  }
}

async function fetchJSON<T>(file: string): Promise<T> {
  try {
    const res = await fetch(`${BASE}/${file}`);

    if (!res.ok) {
      throw new DataFetchError(
        file,
        res.status,
        res.statusText || "Unknown error"
      );
    }

    const data = await res.json() as T;
    return data;
  } catch (err) {
    if (err instanceof DataFetchError) {
      throw err;
    }

    throw new DataFetchError(
      file,
      undefined,
      err instanceof Error ? err.message : "Unknown error"
    );
  }
}

export const getGraph = () => fetchJSON<GraphData>("graph.json");
export const getCollisions = () => fetchJSON<VaultNode[]>("collisions.json");
export const getSparks = () => fetchJSON<VaultNode[]>("sparks.json");
export const getSearchIndex = () => fetchJSON<SearchItem[]>("search-index.json");
export const getTimeline = () => fetchJSON<TimelineEntry[]>("timeline.json");
export const getStats = () => fetchJSON<VaultStats>("stats.json");
export const getDomainNodes = (domain: string) =>
  fetchJSON<VaultNode[]>(`domain-${domain}.json`);

/**
 * Get a single node by ID. Uses cached graph for performance.
 * Returns null if not found (doesn't throw).
 */
export async function getNodeById(id: string): Promise<VaultNode | null> {
  if (!id) return null;

  try {
    const { nodes } = await getGraph();
    return nodes.find((n) => n.id === id) ?? null;
  } catch (err) {
    console.error("Error fetching node by ID:", err);
    return null;
  }
}

/**
 * Get multiple nodes by IDs. Returns only nodes that exist.
 */
export async function getNodesByIds(ids: string[]): Promise<VaultNode[]> {
  if (!ids || ids.length === 0) return [];

  try {
    const { nodes } = await getGraph();
    const map = new Map(nodes.map((n) => [n.id, n]));
    return ids.flatMap((id) => (map.has(id) ? [map.get(id)!] : []));
  } catch (err) {
    console.error("Error fetching nodes by IDs:", err);
    return [];
  }
}

export { DataFetchError };
