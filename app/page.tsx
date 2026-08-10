// app/page.tsx — server component entry point.
// Reads vault JSON at build time, passes data to the client constellation.
import { buildNylusData } from '@/lib/adapt-vault';
import ConstellationApp from '@/components/ConstellationApp';

// Ensure Next.js treats this as a static build (not dynamic per-request).
export const dynamic = 'force-static';

export default async function Home() {
  // No graph pre-warm here: lib/graph-cache reads via fetch('/data/…'), a
  // relative URL that can't resolve during a server build. Nothing consumed
  // the cache anyway — buildNylusData reads the same JSON from disk.
  const data = buildNylusData();
  return <ConstellationApp data={data} />;
}
