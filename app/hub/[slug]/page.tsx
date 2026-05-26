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
  psychology:             'Psychology',
  history:                'History',
  'behavioral-mechanics': 'Behavioral Mechanics',
  'eastern-spirituality': 'Eastern Spirituality',
  'cross-domain':         'Cross-Domain',
  'creative-practice':    'Creative Practice',
  'business':             'Business',
  'african-spirituality': 'African Spirituality',
};

function nodeToSpineConcept(n: any, hubConceptIds: Set<string>): SpineConcept {
  return {
    id:            n.id,
    title:         n.title ?? n.id,
    excerpt:       n.excerpt ?? undefined,
    sources:       typeof n.sources === 'number' ? n.sources : 0,
    backlinkCount: (n.backlinks?.length ?? 0),
    status:        n.status ?? undefined,
    /* only links that also exist in this hub — keeps the panel relevant */
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

  // hub.concepts = only section-placed concepts (build-vault.ts guarantees this post-fix)
  const conceptIds = new Set<string>(hub.concepts ?? []);
  const allConceptNodes = graph.nodes.filter(
    (n: any) => n.type === 'concept' && conceptIds.has(n.id)
  );
  const conceptNodeMap = new Map(allConceptNodes.map((n: any) => [n.id, n]));

  // Sections are pre-parsed at build time — no re-parsing, no drift possible
  const spineSections: SpineSection[] = (hub.sections ?? []).map((sec: any) => ({
    key:      sec.key,
    label:    sec.label,
    level:    sec.level,
    color:    sec.color,
    badge:    sec.badge,
    concepts: (sec.concepts as string[])
      .map((id: string) => conceptNodeMap.get(id))
      .filter(Boolean)
      .map((n: any) => nodeToSpineConcept(n, conceptIds)),
  }));

  // Unplaced: safety net — build fix guarantees hub.concepts = placed only, so this is always []
  const placedIds = new Set(spineSections.flatMap(s => s.concepts.map(c => c.id)));
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
