import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import StrataSurvey, { type Family, type StrataReport, type Stratum } from "@/components/StrataSurvey";

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
  const m = /^\*Source ingests?:?\*?\s*(.+?)\*?$/m.exec(body);
  if (!m) return undefined;
  return m[1]
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[*_]/g, "")
    .trim();
}

// A whole-book report that a by-chapter build replaced carries a
// "⚠ **Superseded**" line in its banner. Parts that merely *point at* one say
// "Supersedes", so anchor to the start of the blockquote line.
function isSuperseded(content: string): boolean {
  return /^>\s*[^\w\s]*\s*\*\*Supersed(ed)\b/m.test(content ?? "");
}

// Fifty-seven files are fourteen builds. Group by the slug stem so the survey
// shows cores rather than a 57-row drop.
function familyKey(id: string): string {
  return id
    .replace(/-worldview-archaeology.*$/, "")
    .replace(/-part-\d+$|-synthesis$/, "");
}

const SMALL = new Set(["of", "the", "and", "in", "on", "a", "to", "for"]);
function titleize(slug: string): string {
  return slug
    .split("-")
    .map((w, i) =>
      i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function kindOf(id: string, content: string): StrataReport["kind"] {
  if (isSuperseded(content)) return "superseded";
  if (/-synthesis$/.test(id)) return "synthesis";
  if (/-part-\d+$/.test(id)) return "part";
  return "single";
}

// Parts in order, then the synthesis, then whatever the build replaced.
function orderOf(id: string, kind: StrataReport["kind"]): number {
  if (kind === "superseded") return 9000;
  if (kind === "synthesis") return 8000;
  const m = /-part-(\d+)$/.exec(id);
  if (m) return parseInt(m[1], 10);
  return 7000;
}

export default function StrataPage() {
  let raw: any[] = [];
  try {
    raw = loadJSON<any[]>("worldview.json");
  } catch { /* no reports yet */ }

  const reports: StrataReport[] = raw.map((r) => {
    const content = r.content ?? "";
    const { strata, depth, deepCount } = toStrata(content);
    const kind = kindOf(r.id, content);
    const key = familyKey(r.id);
    return {
      id: r.id,
      title: r.title,
      domain: r.domain ?? "unknown",
      created: r.created ?? "",
      word_count: r.word_count,
      source_line: sourceLine(content),
      strata,
      depth,
      deepCount,
      family: key,
      familyLabel: titleize(key),
      kind,
      order: orderOf(r.id, kind),
    };
  });

  // ── fold the reports into build families ──────────────────────────────────
  const byFamily = new Map<string, StrataReport[]>();
  for (const r of reports) {
    if (!byFamily.has(r.family)) byFamily.set(r.family, []);
    byFamily.get(r.family)!.push(r);
  }

  const families: Family[] = [...byFamily.entries()].map(([key, rs]) => {
    rs.sort((a, b) => a.order - b.order);
    // A build's domain and source line come from its first live log, not from
    // the whole-book report it replaced.
    const lead = rs.find((r) => r.kind !== "superseded") ?? rs[0];
    return {
      key,
      label: titleize(key),
      domain: lead.domain,
      source_line: lead.source_line,
      reports: rs,
      layers: rs.reduce((n, r) => n + r.strata.length, 0),
      sourced: rs.reduce((n, r) => n + r.depth, 0),
      speculative: rs.reduce((n, r) => n + r.deepCount, 0),
      words: rs.reduce((n, r) => n + (r.word_count ?? 0), 0),
      supersededCount: rs.filter((r) => r.kind === "superseded").length,
      latest: rs.map((r) => r.created).filter(Boolean).sort().slice(-1)[0] ?? "",
    };
  });

  const totalLayers = reports.reduce((n, r) => n + r.strata.length, 0);

  return (
    <>
      <NavG active="Strata" />
      <div className="void-page" style={{ "--domain-color": "#c9836a" } as React.CSSProperties}>
        <div className="void-ambient" />

        {/* The hero is a masthead, not a landing page: the survey is the content,
            so this page keeps the void type scale and shortens it. */}
        <style>{`
          .strata-hero .void-title { font-size: clamp(40px, 5.6vw, 68px); margin-bottom: 16px; }
          .strata-hero .void-lede  { font-size: 17px; line-height: 1.6; margin-bottom: 0; padding-left: 20px; max-width: 760px; }
        `}</style>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "1180px", margin: "0 auto", padding: "36px clamp(20px, 5vw, 64px) 120px" }}>

          <div className="strata-hero">
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em", color: "#c9836a", textTransform: "uppercase", marginBottom: "16px", opacity: 0.75 }}>
            worldview archaeology · core log
          </div>

          <h1 className="void-title">The Strata</h1>

          <p className="void-lede" style={{ "--domain-color": "#c9836a" } as React.CSSProperties}>
            What the people inside a source took for granted — and what those assumptions let them
            do or stopped them doing. Each core is one source, cut chapter by chapter. Solid layers
            are sourced to the text; hatched layers sit below the line, where the reading turns
            speculative on purpose.
          </p>
          </div>

          <div style={{
            display: "flex", gap: "22px", flexWrap: "wrap", alignItems: "center",
            fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px",
            letterSpacing: "0.14em", textTransform: "uppercase", color: "#494456",
            marginTop: "22px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.07)",
          }}>
            <span>{families.length} cores</span>
            <span>{reports.length} logs</span>
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

          <StrataSurvey families={families} />

        </div>
      </div>
    </>
  );
}
