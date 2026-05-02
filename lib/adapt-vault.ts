// lib/adapt-vault.ts
// Server-side: reads vault JSON files → builds NylusData for the constellation.
// Runs once at build time (static generation).

import { readFileSync } from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NylusDomain {
  id: string;      // short: psy, his, beh, eas, crd, cre, ai, afr
  name: string;    // display: Psychology, History, …
  color: string;
  desc: string;
  concepts: number;
  collisions: number;
  sparks: number;
}

export interface NylusConcept {
  id: string;
  title: string;
  domain: string;  // short id
  sources: number;
  sparks: number;
  collisions: number;
  excerpt: string;
}

export interface NylusCollision {
  id: string;
  a: string;       // left side of "X vs Y"
  b: string;       // right side
  domains: [string, string];  // short domain IDs
  note: string;    // excerpt / candidate idea summary
}

export interface NylusSpark {
  id: string;
  text: string;    // title
  domain: string;  // short id
}

export interface NylusTension {
  id: string;
  a: string;
  b: string;
  topic: string;
  domain: string;  // short id
}

export interface NylusEssay {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  mins: number;
  words: number;
  status: string;
  tags: string[];  // domain names matching d.name in DOMAINS
  content: string; // trimmed markdown for the reader
}

export interface NylusStats {
  concepts: number;
  sources: number;
  sparks: number;
  collisions: number;
  tensions: number;
  seeds: number;
  domains: number;
}

export interface NylusData {
  STATS: NylusStats;
  DOMAINS: NylusDomain[];
  CONCEPTS: NylusConcept[];
  COLLISIONS: NylusCollision[];
  SPARKS: NylusSpark[];
  TENSIONS: NylusTension[];
  ESSAYS: NylusEssay[];
}

// ─── Domain config ────────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<string, { id: string; name: string; color: string; desc: string }> = {
  'psychology': {
    id: 'psy', name: 'Psychology', color: '#f59e6f',
    desc: 'What happens inside a person — internal states, development, wounds, and how the self forms and defends itself.',
  },
  'history': {
    id: 'his', name: 'History', color: '#e6c068',
    desc: 'The civilizational record — events, structures, patterns of power, and the rhythms that repeat across time.',
  },
  'behavioral-mechanics': {
    id: 'beh', name: 'Behavioral', color: '#a78bfa',
    desc: 'What you do about it — influence architecture, persuasion, tactics, and the operational logic of moving people.',
  },
  'eastern-spirituality': {
    id: 'eas', name: 'Eastern', color: '#7c8df0',
    desc: 'Contemplative traditions — yoga, Tantra, Vedanta, Buddhism, and the systematic maps of inner worlds.',
  },
  'cross-domain': {
    id: 'crd', name: 'Cross-Domain', color: '#5fc9a8',
    desc: 'Concepts genuinely homeless in one domain — ideas that require two lenses simultaneously to be understood.',
  },
  'creative-practice': {
    id: 'cre', name: 'Creative', color: '#ef5a6f',
    desc: 'The craft of making — writing, narrative structure, aesthetics, voice, and what separates lasting work from noise.',
  },
  'ai-collaboration': {
    id: 'ai', name: 'AI', color: '#9ca3af',
    desc: 'Human-machine cognition — how intelligence augments and extends creative work at the frontier.',
  },
  'african-spirituality': {
    id: 'afr', name: 'African', color: '#34d399',
    desc: 'African and diaspora spiritual traditions — Ifa, Vodou, Odinala, Kemetic cosmology, and living lineage practice.',
  },
};

const DOMAIN_ORDER = ['psychology','history','behavioral-mechanics','eastern-spirituality','cross-domain','creative-practice','ai-collaboration','african-spirituality'];

function shortId(domain: string): string {
  return DOMAIN_CONFIG[domain]?.id ?? 'crd';
}

function domainName(domain: string): string {
  return DOMAIN_CONFIG[domain]?.name ?? 'Cross-Domain';
}

// ─── JSON loader ──────────────────────────────────────────────────────────────

function loadJSON<T>(file: string): T {
  const p = path.join(process.cwd(), 'public/data', file);
  return JSON.parse(readFileSync(p, 'utf-8')) as T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCollisionTitle(title: string): { a: string; b: string } {
  // "X vs. Y: subtitle" or "X vs Y" or "X: Y"
  const vsMatch = title.match(/^(.+?)\s+vs\.?\s+(.+?)(?:\s*:.*)?$/i);
  if (vsMatch) {
    return { a: vsMatch[1].trim(), b: vsMatch[2].trim() };
  }
  const colonIdx = title.indexOf(':');
  if (colonIdx > 0) {
    return { a: title.slice(0, colonIdx).trim(), b: title.slice(colonIdx + 1).trim() };
  }
  const half = Math.floor(title.length / 2);
  return { a: title.slice(0, half).trim(), b: title.slice(half).trim() };
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\n/, '')       // frontmatter
    .replace(/^#{1,6}\s.*$/gm, '')          // headers
    .replace(/\[\[.*?\|?(.*?)\]\]/g, '$1')  // wiki links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // md links
    .replace(/[*_`~]{1,2}/g, '')            // formatting
    .replace(/^\s*[-*+]\s/gm, '')           // bullets
    .trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildNylusData(): NylusData {
  // Load raw files
  const stats = loadJSON<any>('stats.json');
  const rawCollisions = loadJSON<any[]>('collisions.json');
  const rawSparks = loadJSON<any[]>('sparks.json');
  const rawResearch = loadJSON<any[]>('research.json');

  // Build concept→domain map from graph nodes (only id + domain needed)
  // graph.json is large; we parse it once and discard content
  const rawGraph = loadJSON<{ nodes: any[]; edges?: any[]; links?: any[] }>('graph.json');
  const conceptDomainMap = new Map<string, string>();
  const nodeMap = new Map<string, any>();
  for (const node of rawGraph.nodes) {
    conceptDomainMap.set(node.id, node.domain ?? 'cross-domain');
    nodeMap.set(node.id, node);
  }

  // ── STATS ──────────────────────────────────────────────────────────────────
  const essaySeeds = rawSparks.filter((s: any) =>
    s.id?.includes('essay-seed') || s.title?.toLowerCase().includes('essay seed')
  );

  const STATS: NylusStats = {
    concepts:   stats.total_concepts   ?? 0,
    sources:    stats.total_sources    ?? 0,
    sparks:     stats.total_sparks     ?? 0,
    collisions: stats.total_collisions ?? 0,
    tensions:   Math.floor((stats.total_collisions ?? 0) * 0.15),
    seeds:      essaySeeds.length || Math.floor((stats.total_sparks ?? 0) * 0.08),
    domains:    Object.keys(stats.domains ?? {}).length,
  };

  // ── DOMAINS ────────────────────────────────────────────────────────────────
  const statsDomains: Record<string, any> = stats.domains ?? {};

  const DOMAINS: NylusDomain[] = DOMAIN_ORDER
    .filter(d => DOMAIN_CONFIG[d])
    .map(d => {
      const cfg = DOMAIN_CONFIG[d];
      const sd = statsDomains[d] ?? {};
      return {
        id:         cfg.id,
        name:       cfg.name,
        color:      cfg.color,
        desc:       cfg.desc,
        concepts:   sd.count      ?? 0,
        collisions: sd.collisions ?? 0,
        sparks:     sd.sparks     ?? 0,
      };
    });

  // ── CONCEPTS ───────────────────────────────────────────────────────────────
  // Top 50 concept nodes by backlink count
  const conceptNodes = rawGraph.nodes
    .filter((n: any) => n.type === 'concept' && n.title && DOMAIN_CONFIG[n.domain])
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0))
    .slice(0, 50);

  const CONCEPTS: NylusConcept[] = conceptNodes.map((n: any) => ({
    id:         n.id,
    title:      n.title,
    domain:     shortId(n.domain ?? 'cross-domain'),
    sources:    n.sources ?? 0,
    sparks:     0,  // computed post-ingest; not in node metadata
    collisions: 0,
    excerpt:    n.excerpt ?? '',
  }));

  // ── COLLISIONS ─────────────────────────────────────────────────────────────
  function getCollisionDomains(c: any): [string, string] {
    const pair: string[] = [];
    for (const linkId of (c.links ?? []).slice(0, 2)) {
      const dom = conceptDomainMap.get(linkId);
      if (dom) pair.push(shortId(dom));
    }
    if (pair.length === 2 && pair[0] !== pair[1]) return [pair[0], pair[1]];
    // fallback: use collision domain + first linked domain
    const own = shortId(c.domain ?? 'cross-domain');
    return pair.length >= 1 ? [own, pair[0]] : [own, own];
  }

  // Use top 30 collisions (with meaningful a/b sides)
  const COLLISIONS: NylusCollision[] = rawCollisions
    .slice(0, 60)
    .map((c: any) => {
      const { a, b } = parseCollisionTitle(c.title ?? '');
      const note = (c.excerpt ?? c.candidate_idea ?? '').slice(0, 200).trim() || 'A productive tension in the vault.';
      return {
        id:      c.id,
        a:       a.slice(0, 60),
        b:       b.slice(0, 60),
        domains: getCollisionDomains(c),
        note,
      };
    })
    .filter((c: NylusCollision) => c.a && c.b && c.a !== c.b)
    .slice(0, 30);

  // ── SPARKS ─────────────────────────────────────────────────────────────────
  const SPARKS: NylusSpark[] = rawSparks
    .filter((s: any) => s.title && DOMAIN_CONFIG[s.domain])
    .slice(0, 80)
    .map((s: any) => ({
      id:     s.id,
      text:   s.title,
      domain: shortId(s.domain),
    }));

  // ── TENSIONS ───────────────────────────────────────────────────────────────
  // Derive from collisions: each collision IS a tension
  const TENSIONS: NylusTension[] = COLLISIONS.slice(0, 20).map((c, i) => ({
    id:     `ten-${c.id}`,
    a:      c.a,
    b:      c.b,
    topic:  c.note,
    domain: c.domains[0],
  }));

  // ── ESSAYS ─────────────────────────────────────────────────────────────────
  const ESSAYS: NylusEssay[] = rawResearch
    .filter((r: any) => r.status === 'complete' || r.status === 'draft')
    .map((r: any) => {
      const rawContent: string = r.content ?? '';
      const stripped = stripMarkdown(rawContent);
      const words = wordCount(stripped);
      const mins = Math.max(1, Math.ceil(words / 200));
      // First meaningful paragraph as excerpt
      const paragraphs = stripped.split(/\n\n+/).filter((p: string) => p.trim().length > 40);
      const excerpt = paragraphs[0]?.trim() ?? r.title;
      // Trim content for reader (first 3000 chars of stripped text)
      const readerContent = paragraphs.slice(0, 6).join('\n\n').slice(0, 3000);
      return {
        id:      r.id,
        title:   r.title,
        excerpt: excerpt.slice(0, 300),
        date:    r.created ?? '',
        mins,
        words,
        status:  r.status ?? 'complete',
        tags:    [domainName(r.domain ?? 'cross-domain')],
        content: readerContent,
      };
    });

  return { STATS, DOMAINS, CONCEPTS, COLLISIONS, SPARKS, TENSIONS, ESSAYS };
}
