export interface VaultNode {
  id: string;
  title: string;
  type: "concept" | "hub" | "spark" | "collision" | "thread" | "source" | "question" | string;
  subtype?: string;
  domain: string;
  status: "stub" | "developing" | "stable" | "speculative" | "raw" | string;
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
}

export interface VaultEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: VaultNode[];
  edges: VaultEdge[];
}

export interface SearchItem {
  id: string;
  title: string;
  type: string;
  domain: string;
  status: string;
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
  "ai-collaboration": "AI",
  unknown: "Other",
};

export interface IndexConcept {
  slug: string;
  title: string;
  description: string;
  status?: string;
  sources?: number;
  isHub?: boolean;
}

export interface IndexSection {
  title: string;
  level: 2 | 3;
  concepts: IndexConcept[];
  isMeta?: boolean;
}

export const STATUS_COLORS: Record<string, string> = {
  stable: "#22c55e",
  developing: "#f59e0b",
  stub: "#6b7280",
  speculative: "#a78bfa",
  raw: "#94a3b8",
};
