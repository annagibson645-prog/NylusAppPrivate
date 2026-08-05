import { readFileSync } from "fs";
import path from "path";
import HubShapePrototypes, { ProtoHub } from "@/components/HubShapePrototypes";

export const dynamic = "force-dynamic";

interface HubRaw {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt?: string;
  covers?: number;
}

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function HubsProtoPage() {
  const rawHubs = loadJSON<HubRaw[]>("hubs.json");

  // A representative spread across domains, not just the first N alphabetically.
  const wanted = [
    "Śiva the Paradox",
    "Chase Hughes",
    "Robert Greene",
    "Worldbuilding Systems",
    "Genghis Khan",
    "Archetypal Psychology",
  ];
  const picked: HubRaw[] = [];
  for (const w of wanted) {
    const found = rawHubs.find((h) => h.title.includes(w));
    if (found) picked.push(found);
  }
  for (const h of rawHubs) {
    if (picked.length >= 6) break;
    if (!picked.includes(h)) picked.push(h);
  }

  const hubs: ProtoHub[] = picked.slice(0, 6).map((h) => ({
    id: h.id,
    title: h.title,
    domain: h.domain,
    color: h.color,
    excerpt: h.excerpt ?? "",
    covers: h.covers ?? 0,
  }));

  return (
    <div style={{ background: "var(--h-bg, #0b0a12)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "56px 24px 120px" }}>
        <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--h-text3)", marginBottom: 14 }}>
          prototype · not live
        </div>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 44, fontWeight: 400, color: "var(--h-text)", margin: "0 0 10px" }}>
          Five Hub Card Shapes
        </h1>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontStyle: "italic", color: "var(--h-text2)", margin: "0 0 56px", maxWidth: 680 }}>
          Same six hubs, five icon treatments. Hover each card to see its motion.
          Nothing here touches the live /hubs page yet.
        </p>
        <HubShapePrototypes hubs={hubs} />
      </div>
    </div>
  );
}
