import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import CraftLedger, { type CraftNode } from "@/components/CraftLedger";

export const dynamic = "force-dynamic";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function CraftPage() {
  let raw: any[] = [];
  try {
    raw = loadJSON<any[]>("craft.json");
  } catch { /* no craft reports yet */ }

  const reports: CraftNode[] = raw
    .filter((r) => r.status === "complete" || r.status === "draft")
    .map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt ?? "",
      source_material: r.source_material,
      techniques: r.techniques,
      created: r.created ?? "",
      word_count: r.word_count ?? 0,
      status: r.status,
    }));

  return (
    <>
      <NavG active="Craft Reports" count={{ value: reports.length, label: "reports", color: "#14b8a6" }} />
      <div className="void-page" style={{ "--domain-color": "#14b8a6" } as React.CSSProperties}>
        <div className="void-ambient" />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px) 160px" }}>

          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em", color: "#14b8a6", textTransform: "uppercase", marginBottom: "24px", opacity: 0.85 }}>
            nylus vault · craft
          </div>

          <h1 className="void-title">The Sharpening.</h1>

          <p className="void-lede" style={{ "--domain-color": "#14b8a6" } as React.CSSProperties}>
            Writing-craft coaching sessions, kept honest — the technique, why it works, and what to try next.
          </p>

          <div style={{ marginTop: 56 }}>
            <CraftLedger reports={reports} />
          </div>

        </div>
      </div>
    </>
  );
}
