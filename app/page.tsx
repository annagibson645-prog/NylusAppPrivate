export const dynamic = 'force-dynamic';

// app/page.tsx — server component entry point.
// Reads vault JSON at build time, passes data to the client constellation.
import { buildNylusData } from '@/lib/adapt-vault';
import ConstellationApp from '@/components/ConstellationApp';

// Ensure Next.js treats this as a static build (not dynamic per-request).
export const dynamic = 'force-static';

export default function Home() {
  const data = buildNylusData();
  return <ConstellationApp data={data} />;
}
