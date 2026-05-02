// lib/adapt-vault.ts
// Server-side: reads vault JSON files → builds NylusData for the constellation.

import { readFileSync } from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NylusDomain {
  id: string;       // short: psy, his, beh, eas, crd, cre, ai, afr
  key: string;      // full: psychology, history, …
  name: string;     // display: Psychology, History, …
  color: string;
  desc: string;
  concepts: number;
  collisions: number;
  sparks: number;
  hubs: number;
}

export interface NylusHub {
  id: string;
  title: string;
  domain: string;   // full domain key
  domainShort: string;
  color: string;
  excerpt: string;
  covers: number;   // concept count
  concepts: string[]; // concept IDs inside this hub
}

export interface NylusConcept {
  id: string;
  title: string;
  domain: string;      // short id (psy, his, …)
  domainKey: string;   // full domain key (psychology, history, …)
  color: string;
  hub: string | null;  // hub slug if grouped
  sources: number;
  excerpt: string;
  tags: string[];
}

export interface NylusCollision {
  id: string;
  a: string;
  b: string;
  domains: [string, string];
  color: string;
  note: string;
}

export interface NylusSpark {
  id: string;
  text: string;
  domain: string;      // short id
  domainKey: string;
  color: string;
  excerpt: string;
}

export interface NylusTension {
  id: string;
  a: string;
  b: string;
  topic: string;
  domain: string;
}

export interface NylusEssay {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  mins: number;
  words: number;
  status: string;
  tags: string[];
  content: string;
  color: string;
}

export interface NylusStats {
  concepts: number;
  sources: number;
  sparks: number;
  collisions: number;
  tensions: number;
  seeds: number;
  hubs: number;
  domains: number;
}

export interface NylusData {
  STATS: NylusStats;
  DOMAINS: NylusDomain[];
  HUBS: NylusHub[];
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

const DOMAIN_ORDER = [
  'psychology','history','behavioral-mechanics','eastern-spirituality',
  'cross-domain','creative-practice','ai-collaboration','african-spirituality',
];

export function shortId(domain: string): string {
  return DOMAIN_CONFIG[domain]?.id ?? 'crd';
}

export function domainName(domain: string): string {
  return DOMAIN_CONFIG[domain]?.name ?? 'Cross-Domain';
}

export function domainColor(domain: string): string {
  return DOMAIN_CONFIG[domain]?.color ?? '#5fc9a8';
}

// ─── JSON loader ──────────────────────────────────────────────────────────────

function loadJSON<T>(file: string): T {
  const p = path.join(process.cwd(), 'public/data', file);
  return JSON.parse(readFileSync(p, 'utf-8')) as T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCollisionTitle(title: string): { a: string; b: string } {
  const vsMatch = title.match(/^(.+?)\s+vs\.?\s+(.+?)(?:\s*:.*)?$/i);
  if (vsMatch) return { a: vsMatch[1].trim(), b: vsMatch[2].trim() };
  const colonIdx = title.indexOf(':');
  if (colonIdx > 0) return { a: title.slice(0, colonIdx).trim(), b: title.slice(colonIdx + 1).trim() };
  const half = Math.floor(title.length / 2);
  return { a: title.slice(0, half).trim(), b: title.slice(half).trim() };
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\[\[.*?\|?(.*?)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]{1,2}/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// derive simple tags from domain + backlinks
function inferTags(n: any): string[] {
  const tags: string[] = [];
  const d = n.domain ?? '';
  if (d) tags.push(domainName(d));
  // add source-count tier
  const s = n.sources ?? 0;
  if (s >= 3) tags.push('well-sourced');
  else if (s === 0) tags.push('stub');
  return tags;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildNylusData(): NylusData {
  const stats       = loadJSON<any>('stats.json');
  const rawCollisions = loadJSON<any[]>('collisions.json');
  const rawSparks   = loadJSON<any[]>('sparks.json');
  const rawResearch = loadJSON<any[]>('research.json');
  const rawEssays   = loadJSON<any[]>('essays.json');
  const rawHubs     = loadJSON<any[]>('hubs.json');
  const rawGraph    = loadJSON<{ nodes: any[] }>('graph.json');

  // Build id→node map once
  const nodeMap = new Map<string, any>();
  for (const n of rawGraph.nodes) nodeMap.set(n.id, n);

  // ── HUBS ───────────────────────────────────────────────────────────────────
  const HUBS: NylusHub[] = rawHubs
    .filter((h: any) => DOMAIN_CONFIG[h.domain] || h.domain === 'cross-domain')
    .map((h: any) => ({
      id:          h.id,
      title:       h.title,
      domain:      h.domain ?? 'cross-domain',
      domainShort: shortId(h.domain ?? 'cross-domain'),
      color:       domainColor(h.domain ?? 'cross-domain'),
      excerpt:     h.excerpt ?? '',
      covers:      h.covers ?? (h.concepts?.length ?? 0),
      concepts:    h.concepts ?? [],
    }));

  // hub id → hub for fast lookup
  const hubMap = new Map<string, NylusHub>();
  for (const h of HUBS) hubMap.set(h.id, h);

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
    hubs:       HUBS.length,
    domains:    Object.keys(stats.domains ?? {}).length,
  };

  // ── DOMAINS ────────────────────────────────────────────────────────────────
  const statsDomains: Record<string, any> = stats.domains ?? {};

  const DOMAINS: NylusDomain[] = DOMAIN_ORDER
    .filter(d => DOMAIN_CONFIG[d])
    .map(d => {
      const cfg = DOMAIN_CONFIG[d];
      const sd  = statsDomains[d] ?? {};
      return {
        id:         cfg.id,
        key:        d,
        name:       cfg.name,
        color:      cfg.color,
        desc:       cfg.desc,
        concepts:   sd.count      ?? 0,
        collisions: sd.collisions ?? 0,
        sparks:     sd.sparks     ?? 0,
        hubs:       HUBS.filter(h => h.domain === d).length,
      };
    });

  // ── CONCEPTS ───────────────────────────────────────────────────────────────
  // Top 100 concept nodes by backlink count, extended with hub + color
  const conceptNodes = rawGraph.nodes
    .filter((n: any) => n.type === 'concept' && n.title && DOMAIN_CONFIG[n.domain])
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0))
    .slice(0, 100);

  const CONCEPTS: NylusConcept[] = conceptNodes.map((n: any) => {
    const dk = n.domain ?? 'cross-domain';
    return {
      id:        n.id,
      title:     n.title,
      domain:    shortId(dk),
      domainKey: dk,
      color:     domainColor(dk),
      hub:       n.hub ?? null,
      sources:   n.sources ?? 0,
      excerpt:   n.excerpt ?? '',
      tags:      inferTags(n),
    };
  });

  // ── COLLISIONS ─────────────────────────────────────────────────────────────
  function getCollisionDomains(c: any): [string, string] {
    const pair: string[] = [];
    for (const linkId of (c.links ?? []).slice(0, 2)) {
      const dom = nodeMap.get(linkId)?.domain;
      if (dom) pair.push(shortId(dom));
    }
    if (pair.length === 2 && pair[0] !== pair[1]) return [pair[0], pair[1]];
    const own = shortId(c.domain ?? 'cross-domain');
    return pair.length >= 1 ? [own, pair[0]] : [own, own];
  }

  const COLLISIONS: NylusCollision[] = rawCollisions
    .slice(0, 60)
    .map((c: any) => {
      const { a, b } = parseCollisionTitle(c.title ?? '');
      const dk = c.domain ?? 'cross-domain';
      return {
        id:      c.id,
        a:       a.slice(0, 60),
        b:       b.slice(0, 60),
        domains: getCollisionDomains(c),
        color:   domainColor(dk),
        note:    (c.excerpt ?? c.candidate_idea ?? '').slice(0, 200).trim() || 'A productive tension in the vault.',
      };
    })
    .filter((c: NylusCollision) => c.a && c.b && c.a !== c.b)
    .slice(0, 40);

  // ── SPARKS ─────────────────────────────────────────────────────────────────
  // Exclude essay seeds — those are a separate type
  const SPARKS: NylusSpark[] = rawSparks
    .filter((s: any) =>
      s.title &&
      DOMAIN_CONFIG[s.domain] &&
      !s.id?.includes('essay-seed') &&
      s.subtype !== 'essay-seed'
    )
    .slice(0, 100)
    .map((s: any) => {
      const dk = s.domain ?? 'cross-domain';
      return {
        id:        s.id,
        text:      s.title,
        domain:    shortId(dk),
        domainKey: dk,
        color:     domainColor(dk),
        excerpt:   s.excerpt ?? '',
      };
    });

  const TENSIONS: NylusTension[] = COLLISIONS.slice(0, 20).map((c) => ({
    id: `ten-${c.id}`, a: c.a, b: c.b, topic: c.note, domain: c.domains[0],
  }));

  const ESSAYS: NylusEssay[] = rawEssays
    .filter((r: any) => r.status === 'complete' || r.status === 'draft')
    .map((r: any) => {
      const raw = r.content ?? '';
      const stripped = stripMarkdown(raw);
      const words = wordCount(stripped);
      const mins = Math.max(1, Math.ceil(words / 200));
      const paras = stripped.split(/\n\n+/).filter((p: string) => p.trim().length > 40);
      const excerpt = paras[0]?.trim() ?? r.title;
      const dk = r.domain ?? 'cross-domain';
      return {
        id:      r.id,
        title:   r.title,
        excerpt: excerpt.slice(0, 300),
        date:    r.created ?? '',
        mins,
        words,
        status:  r.status ?? 'complete',
        tags:    [domainName(dk)],
        content: paras.slice(0, 6).join('\n\n').slice(0, 3000),
        color:   domainColor(dk),
      };
    });

  return { STATS, DOMAINS, HUBS, CONCEPTS, COLLISIONS, SPARKS, TENSIONS, ESSAYS };
}
