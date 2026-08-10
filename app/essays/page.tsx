import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import EssaysCabinet, { type EssayNode } from "@/components/EssaysCabinet";

export const dynamic = "force-static";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function EssaysPage() {
  let raw: any[] = [];
  try {
    raw = loadJSON<any[]>("essays.json");
  } catch { /* no essays yet */ }

  const essays: EssayNode[] = raw
    // Only finished, hand-placed essays belong here. Essay *seeds* live under
    // LAB/Sparks (type: spark, subtype: essay-seed) and must never surface here.
    .filter((e) => e.status === "complete")
    .map((e) => ({
      id: e.id,
      title: e.title,
      domain: e.domain ?? null,
      excerpt: e.excerpt ?? "",
      word_count: e.word_count ?? 0,
      created: e.created ?? "",
      status: e.status,
    }));

  return (
    <>
      <NavG active="Essays" count={{ value: essays.length, label: "essays", color: "#38bdf8" }} />
      <div className="void-page">
        <div className="void-ambient" />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px) 160px" }}>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.28em", color: "#38bdf8", textTransform: "uppercase", marginBottom: 24, opacity: 0.85 }}>
            nylus vault · essays
          </div>
          <h1 className="void-title">What Fixed in Writing.</h1>
          <p className="void-lede" style={{ "--domain-color": "#38bdf8" } as React.CSSProperties}>
            Browse by domain — click one to open it, click an essay to read it.
          </p>

          <div style={{ marginTop: 40 }}>
            <EssaysCabinet essays={essays} />
          </div>
        </div>
      </div>
    </>
  );
}
