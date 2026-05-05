// app/page.tsx — server component entry point.
// Reads vault JSON at build time, passes data to the client constellation.
import { buildNylusData } from '@/lib/adapt-vault';
import { loadGraphCache } from '@/lib/graph-cache';
import ConstellationApp from '@/components/ConstellationApp';

// Ensure Next.js treats this as a static build (not dynamic per-request).
export const dynamic = 'force-static';

export default async function Home() {
  // Pre-warm the graph cache so other components can use it
  try {
    await loadGraphCache();
  } catch (err) {
    console.warn('Graph cache pre-warm failed:', err);
    // Continue anyway — buildNylusData will fetch independently
  }

  const data = buildNylusData();
  return <ConstellationApp data={data} />;
}
