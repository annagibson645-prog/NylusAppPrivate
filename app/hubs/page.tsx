import { readFileSync } from "fs";
import path from "path";
import { Suspense } from "react";
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

interface GraphNode {
  id: string;
  title: string;
  type: string;
  domain: string;
  status: string;
  excerpt?: string;
  hub?: string;
}

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function Page() {
  const rawHubs = loadJSON<HubRaw[]>("hubs.json");
  const graph   = loadJSON<{ nodes: GraphNode[] }>("graph.json");

  const hubs = rawHubs.map((h) => ({
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

  // Concepts with no hub assignment — the live catch-all
  const ungrouped = graph.nodes
    .filter((n) => n.type === "concept" && !n.hub && n.status !== "archived")
    .map((n) => ({
      id: n.id,
      title: n.title,
      domain: n.domain,
      excerpt: (n.excerpt ?? "").slice(0, 100),
      status: n.status,
    }));

  return (
    <Suspense>
      <HubsCompassRose hubs={hubs} ungrouped={ungrouped} />
    </Suspense>
  );
}
