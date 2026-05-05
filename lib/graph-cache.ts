// lib/graph-cache.ts
// Singleton graph cache with precomputed indexes

import type { VaultNode, GraphData } from './types';
import { getGraph } from './data';

interface GraphCache {
  data: GraphData | null;
  nodeMap: Map<string, VaultNode>;
  domainMap: Map<string, VaultNode[]>;
  isLoading: boolean;
  error: Error | null;
}

let cache: GraphCache = {
  data: null,
  nodeMap: new Map(),
  domainMap: new Map(),
  isLoading: false,
  error: null,
};

/**
 * Load and cache the full graph. Subsequent calls return cached data.
 * Safe to call multiple times — only loads once.
 */
export async function loadGraphCache(): Promise<GraphData> {
  // Already loaded
  if (cache.data) return cache.data;

  // Already loading
  if (cache.isLoading) {
    // Wait for in-flight load
    let attempts = 0;
    while (cache.isLoading && attempts < 100) {
      await new Promise(r => setTimeout(r, 10));
      attempts++;
    }
    if (cache.data) return cache.data;
    if (cache.error) throw cache.error;
  }

  cache.isLoading = true;
  try {
    const data = await getGraph();

    // Build indexes
    const nodeMap = new Map<string, VaultNode>();
    const domainMap = new Map<string, VaultNode[]>();

    for (const node of data.nodes) {
      nodeMap.set(node.id, node);

      const domain = node.domain || 'unknown';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain)!.push(node);
    }

    cache.data = data;
    cache.nodeMap = nodeMap;
    cache.domainMap = domainMap;
    cache.error = null;

    return data;
  } catch (err) {
    cache.error = err as Error;
    throw err;
  } finally {
    cache.isLoading = false;
  }
}

/**
 * Get a single node by ID from cache (requires loadGraphCache called first)
 */
export async function getNodeByIdCached(id: string): Promise<VaultNode | null> {
  await loadGraphCache();
  return cache.nodeMap.get(id) ?? null;
}

/**
 * Get multiple nodes by IDs from cache
 */
export async function getNodesByIdsCached(ids: string[]): Promise<VaultNode[]> {
  await loadGraphCache();
  return ids
    .map(id => cache.nodeMap.get(id))
    .filter((n): n is VaultNode => n !== undefined);
}

/**
 * Get all nodes for a domain from cache
 */
export async function getNodesByDomainCached(domain: string): Promise<VaultNode[]> {
  await loadGraphCache();
  return cache.domainMap.get(domain) ?? [];
}

/**
 * Clear cache (for testing or manual reset)
 */
export function clearGraphCache(): void {
  cache = {
    data: null,
    nodeMap: new Map(),
    domainMap: new Map(),
    isLoading: false,
    error: null,
  };
}
