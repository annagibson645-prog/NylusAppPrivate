export type VaultNodeType =
  | "concept"
  | "hub"
  | "spark"
  | "collision"
  | "thread"
  | "source"
  | "question"
  | "essay"
  | "research"
  | "craft";

export type VaultNodeStatus =
  | "stub"
  | "developing"
  | "stable"
  | "speculative"
  | "raw"
  | "complete"
  | "draft";

export interface VaultNode {
  id: string;
  title: string;
  type: VaultNodeType;
  subtype?: string;
  domain: string;
  status: VaultNodeStatus;
  created: string;
  updated: string;
  sources: number;
  path: string;
  content: string;
  excerpt: string;
  links: string[];
  backlinks: string[];
  hub: string | null;
  age_days: number;
  color: string;
  classification?: string;
  live_wire?: string;
  candidate_idea?: string;
  tension_a?: string;
  tension_b?: string;
  pressure_score?: number;
  word_count?: number;
  research_domains?: Record<string, number>;
  source_material?: string;
  techniques?: string[];
}

/** graph.json. Structural index only — no `content`, and no edge list: an
 *  `edges` array used to sit alongside `nodes` here but nothing ever read it,
 *  since `links` and `backlinks` on each node already carry the same relation.
 *  Dropped from the generated file 2026-08-20. */
export interface GraphData {
  nodes: VaultNode[];
}

export interface SearchItem {
  id: string;
  title: string;
  type: VaultNodeType;
  domain: string;
  status: VaultNodeStatus;
  excerpt: string;
  path: string;
  color: string;
}

export interface TimelineEntry {
  date: string;
  action: string;
  description: string;
}

export interface DomainStats {
  count: number;
  collisions: number;
  sparks: number;
  color: string;
}

export interface VaultStats {
  total_concepts: number;
  total_hubs: number;
  total_sources: number;
  total_sparks: number;
  total_collisions: number;
  domains: Record<string, DomainStats>;
}

export const DOMAIN_LABELS: Record<string, string> = {
  history: "History",
  "eastern-spirituality": "Eastern",
  psychology: "Psychology",
  "behavioral-mechanics": "Behavioral",
  "cross-domain": "Cross-Domain",
  "creative-practice": "Creative",
  "african-spirituality": "African",
  "business": "Business",
  "occult": "Occult",
  unknown: "Other",
};

export interface IndexConcept {
  slug: string;
  title: string;
  description: string;
  status?: VaultNodeStatus;
  sources?: number;
  isHub?: boolean;
}

export interface IndexSection {
  title: string;
  level: 2 | 3;
  concepts: IndexConcept[];
  isMeta?: boolean;
}

export const STATUS_COLORS: Record<VaultNodeStatus, string> = {
  stable: "#22c55e",
  developing: "#f59e0b",
  stub: "#6b7280",
  speculative: "#a78bfa",
  raw: "#94a3b8",
  complete: "#22c55e",
  draft: "#f59e0b",
};

export function isNodeType(node: VaultNode, type: VaultNodeType): boolean {
  return node.type === type;
}

export function isNodeStatus(node: VaultNode, status: VaultNodeStatus): boolean {
  return node.status === status;
}
