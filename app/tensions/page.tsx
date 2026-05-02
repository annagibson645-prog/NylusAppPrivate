import { buildNylusData } from '@/lib/adapt-vault';
import ConstellationApp from '@/components/ConstellationApp';

export const dynamic = 'force-static';

export default function Page() {
  const data = buildNylusData();
  return <ConstellationApp data={data} initialPage="tensions" />;
}
