import { readFileSync } from "fs";
import path from "path";
import HubsCompassRose, { type SlimHub } from "@/components/HubsCompassRose";

export const dynamic = "force-static";

interface HubRaw {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt?: string;
  covers?: number;
}

export default function Page() {
  const raw = readFileSync(
    path.join(process.cwd(), "public/data/hubs.json"),
    "utf-8"
  );
  const rawHubs: HubRaw[] = JSON.parse(raw);

  // Strip heavy content/concepts fields — only pass what the UI needs
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
