import { readFileSync } from "fs";
import path from "path";
import HubsCompassRose from "@/components/HubsCompassRose";

export const dynamic = "force-dynamic";

interface HubRaw {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt?: string;
  covers?: number;
}

interface SlimHub {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt: string;
  covers: number;
}

export default function Page() {
  const raw = readFileSync(
    path.join(process.cwd(), "public/data/hubs.json"),
    "utf-8"
  );
  const rawHubs: HubRaw[] = JSON.parse(raw);

  const hubs: SlimHub[] = rawHubs.map((h) => ({
    id: h.id,
    title: h.title
      .replace(" — Map of Content", "")
      .replace(/ Hub$/i, "")
      .trim(),
    domain: h.domain,
    color: h.color,
    excerpt: (h.excerpt ?? "").slice(0, 120),
    covers: h.covers ?? 0,
  }));

  return <HubsCompassRose hubs={hubs} />;
}
