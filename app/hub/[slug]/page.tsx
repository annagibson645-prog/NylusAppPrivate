export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { domainColor } from '@/lib/adapt-vault';
import HubSpineClient, {
  type SpineConcept,
  type SpineSection,
} from '@/components/HubSpineClient';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', file), 'utf-8'));
}

const DOMAIN_FULL: Record<string, string> = {
  psychology:              'Psychology',
  history:                 'History',
  'behavioral-mechanics':  'Behavioral Mechanics',
  'eastern-spirituality':  'Eastern Spirituality',
  'cross-domain':          'Cross-Domain',
  'creative-practice':     'Creative Practice',
  'ai-collaboration':      'AI Collaboration',
  'african-spirituality':  'African Spirituality',
};

const SKIP_SECTIONS = new Set([
  'what this hub covers',
  'how to navigate this hub',
  'key tensions',
  'key tensions in this area',
  'cross-domain connections',
  'cross-domain connection',
  'related hubs',
  'structural notes',
  'overview',
  'convergence points',
  'source node',
  'sources',
]);

const LEVEL_ORDER: Record<string, number> = {
  foundational: 0,
  intermediate:  1,
  advanced:      2,
  thematic:      3,
};

const LEVEL_BADGE: Record<string, string> = {
  foundational: 'Foundational',
  intermediate:  'Intermediate',
  advanced:      'Advanced',
  thematic:      '',
};

const LEVEL_COLOR: Record<string, string> = {
  foundational: '#6bab8a',
  intermediate:  '#c8a460',
  advanced:      '#9f7ec0',
  thematic:      '#4a4468',
};

interface RawSection {
  title: string;
  label: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'thematic';
  conceptIds: string[];
}

function parseHubSections(content: string, validIds: Set<string>): RawSection[] {
  if (!content) return [];
  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  const seen = new Set<string>();

  for (const line of content.split('\n')) {
    if (/^## /.test(line)) {
      const raw   = line.replace(/^## /, '').trim();
      const lower = raw.toLowerCase().replace(/[🗺️🔗🛠️]/gu, '').trim();
      if (SKIP_SECTIONS.has(lower)) { current = null; continue; }

      let level: RawSection['level'] = 'thematic';
      if (/beginner/i.test(raw))       level = 'foundational';
      else if (/intermediate/i.test(raw)) level = 'intermediate';
      else if (/advanced/i.test(raw))  level = 'advanced';

      const label = raw
        .replace(/[🗺️🔗🛠️]/gu, '')
        .replace(/^(BEGINNER LEVEL|INTERMEDIATE LEVEL|ADVANCED LEVEL)[:\s—\-]*/i, '')
        .trim();

      current = { title: raw, label: label || raw, level, conceptIds: [] };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const wikiRe = /\[\[ARCHIVES\/concepts\/[^/]+\/([^|\]]+)[|\]]/g;
    let m: RegExpExecArray | null;
    while ((m = wikiRe.exec(line)) !== null) {
      const id = m[1].trim();
      if (validIds.has(id) && !seen.has(id)) {
        current.conceptIds.push(id);
        seen.add(id);
      }
    }
  }

  return sections
    .filter(s => s.conceptIds.length > 0)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

function nodeToSpineConcept(n: any, hubConceptIds: Set<string>): SpineConcept {
  return {
    id:            n.id,
    title:         n.title ?? n.id,
    excerpt:       n.excerpt ?? undefined,
    sources:       typeof n.sources === 'number' ? n.sources : 0,
    backlinkCount: (n.backlinks?.length ?? 0),
    status:        n.status ?? undefined,
    /* only links that are also in this hub — keeps the panel relevant */
    links: (n.links ?? []).filter((lid: string) => hubConceptIds.has(lid)),
  };
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hubs  = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const hub = hubs.find((h: any) => h.id === slug);
  if (!hub) notFound();

  const color = domainColor(hub.domain);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;

  const conceptIds = new Set<string>(hub.concepts ?? []);
  const allConceptNodes = graph.nodes.filter(
    (n: any) => n.type === 'concept' && conceptIds.has(n.id)
  );
  const conceptNodeMap = new Map(allConceptNodes.map((n: any) => [n.id, n]));

  /* Parse raw sections → SpineSection[] */
  const rawSections = parseHubSections(hub.content ?? '', conceptIds);
  const placedIds   = new Set(rawSections.flatMap(s => s.conceptIds));

  const spineSections: SpineSection[] = rawSections.map(raw => ({
    key:      raw.title,
    label:    raw.label,
    level:    raw.level,
    color:    LEVEL_COLOR[raw.level],
    badge:    LEVEL_BADGE[raw.level],
    concepts: raw.conceptIds
      .map(id => conceptNodeMap.get(id))
      .filter(Boolean)
      .map((n: any) => nodeToSpineConcept(n, conceptIds)),
  }));

  /* Unplaced concepts — sorted by backlink count */
  const unplacedConcepts: SpineConcept[] = allConceptNodes
    .filter((n: any) => !placedIds.has(n.id))
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0))
    .map((n: any) => nodeToSpineConcept(n, conceptIds));

  const hubTitle = hub.title
    .replace(/ — Map of Content$/, '')
    .replace(/ Hub$/, '');

  return (
    <HubSpineClient
      title={hubTitle}
      domain={hub.domain}
      domainLabel={label}
      domainColor={color}
      excerpt={hub.excerpt}
      path={hub.path}
      sections={spineSections}
      unplaced={unplacedConcepts}
    />
  );
}
