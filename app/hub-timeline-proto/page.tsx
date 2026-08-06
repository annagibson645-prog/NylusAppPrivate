// app/hub-timeline-proto/page.tsx
// Prototype: horizontal, level-colored rail navigator for the hub page's concept
// spine, replacing the vertical line. Sections keep their own heading; the rail
// itself carries the foundational/intermediate/advanced signal as a color band
// (green/yellow/red) with a comet field and a faint watermark word, instead of a
// repeated badge on every dot. Thematic sections still appear as dots but get no
// color banding. Uses one real hub's data so the comparison is honest.

export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { domainColor } from '@/lib/adapt-vault';
import HubTimelineProtoClient, {
  type ProtoConcept,
  type ProtoSection,
} from '@/components/HubTimelineProtoClient';

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
  business:               'Business',
  'african-spirituality': 'African Spirituality',
};

function nodeToProtoConcept(n: any): ProtoConcept {
  return {
    id: n.id,
    title: n.title ?? n.id,
    excerpt: n.excerpt ?? undefined,
    sources: typeof n.sources === 'number' ? n.sources : 0,
    backlinkCount: n.backlinks?.length ?? 0,
    status: n.status ?? undefined,
  };
}

export default async function HubTimelineProtoPage({
  searchParams,
}: {
  searchParams: Promise<{ hub?: string }>;
}) {
  const hubs  = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const requested = (await searchParams)?.hub;
  const hub =
    (requested && hubs.find((h: any) => h.id === requested)) ??
    hubs.find((h: any) => h.id === 'capital-accumulation-consolidation-hub') ??
    hubs[0];
  if (!hub) notFound();

  const color = domainColor(hub.domain);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;
  const conceptMap = new Map(graph.nodes.map((n: any) => [n.id, n]));

  const sections: ProtoSection[] = (hub.sections ?? []).map((sec: any) => ({
    key: sec.key,
    label: sec.label,
    level: sec.level,
    badge: sec.badge,
    concepts: (sec.concepts as string[])
      .map((id: string) => conceptMap.get(id))
      .filter(Boolean)
      .map(nodeToProtoConcept),
  })).filter((sec: ProtoSection) => sec.concepts.length > 0);

  const hubTitle = hub.title
    .replace(/ — Map of Content$/, '')
    .replace(/ Hub$/, '');

  return (
    <HubTimelineProtoClient
      title={hubTitle}
      domain={hub.domain}
      domainLabel={label}
      domainColor={color}
      excerpt={hub.excerpt}
      path={hub.path}
      sections={sections}
    />
  );
}
