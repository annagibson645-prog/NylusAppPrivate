import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import StrataColumn, { type StrataReport, type Stratum } from "@/components/StrataColumn";

export const dynamic = "force-static";

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

// Pull the report's own section headings out of the markdown, and mark
// everything after the "# Below the Line" divider as speculative.
function toStrata(content: string): { strata: Stratum[]; depth: number; deepCount: number } {
  const body = (content ?? "").replace(/^---[\s\S]*?---\n?/, "");
  const lines = body.split(/\r?\n/);
  const strata: Stratum[] = [];
  let deep = false;

  for (const line of lines) {
    if (/^#\s+Below the Line/i.test(line)) { deep = true; continue; }
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const label = m[1]
      .replace(/`\[SPECULATIVE\]`/gi, "")
      .replace(/`/g, "")
      .replace(/\*\*/g, "")
      .trim();
    if (!label) continue;
    strata.push({ label, deep });
  }

  return {
    strata,
    depth: strata.filter((s) => !s.deep).length,
    deepCount: strata.filter((s) => s.deep).length,
  };
}

// The italic attribution line the reports carry under the banner.
function sourceLine(content: string): string | undefined {
  const body = (content ?? "").replace(/^---[\s\S]*?---\n?/, "");
  const m = /^\*Source ingest:?\*?\s*(.+?)\*?$/m.exec(body);
  if (!m) return undefined;
  return m[1]
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[*_]/g, "")
    .trim();
}

export default function StrataPage() {
  let raw: any[] = [];
  try {
    raw = loadJSON<any[]>("worldview.json");
  } catch { /* no reports yet */ }

  const reports: StrataReport[] = raw.map((r) => {
    const { strata, depth, deepCount } = toStrata(r.content ?? "");
    return {
      id: r.id,
      title: r.title,
      domain: r.domain ?? "unknown",
      created: r.created ?? "",
      word_count: r.word_count,
      source_line: sourceLine(r.content ?? ""),
      strata,
      depth,
      deepCount,
    };
  });

  const totalLayers = reports.reduce((n, r) => n + r.strata.length, 0);

  return (
    <>
      <NavG active="Strata" />
      <div className="void-page" style={{ "--domain-color": "#c9836a" } as React.CSSProperties}>
        <div className="void-ambient" />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px) 160px" }}>

          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em", color: "#c9836a", textTransform: "uppercase", marginBottom: "24px", opacity: 0.75 }}>
            worldview archaeology · core log
          </div>

          <h1 className="void-title">The Strata</h1>

          <p className="void-lede" style={{ "--domain-color": "#c9836a" } as React.CSSProperties}>
            What the people inside a source took for granted — and what those assumptions let them
            do or stopped them doing. Each core is cut chapter by chapter. Solid layers are sourced
            to the text; hatched layers sit below the line, where the reading turns speculative on
            purpose. Click a core to read its log.
          </p>

          <div style={{
            display: "flex", gap: "28px", flexWrap: "wrap",
            fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px",
            letterSpacing: "0.14em", textTransform: "uppercase", color: "#494456",
            marginTop: "34px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.07)",
          }}>
            <span>{reports.length} cores</span>
            <span>{totalLayers} layers</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "16px", height: "8px", background: "#c9836a", opacity: 0.55, borderRadius: "1px" }} />
              sourced
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
              <span style={{
                width: "16px", height: "8px", background: "#4a4152", opacity: 0.55, borderRadius: "1px",
                backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.16) 2px, rgba(255,255,255,0.16) 4px)",
              }} />
              speculative
            </span>
          </div>

          <StrataColumn reports={reports} />

        </div>
      </div>
    </>
  );
}
