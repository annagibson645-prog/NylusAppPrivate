import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";
import NavG from "@/components/NavG";

export const dynamic = "force-dynamic";

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain":         "#38bdf8",
  "psychology":           "#3b82f6",
  "eastern-spirituality": "#dc2626",
  "behavioral-mechanics": "#f97316",
  "creative-practice":    "#14b8a6",
  "history":              "#f59e0b",
  "african-spirituality": "#10b981",
  "business":             "#e879a0",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain":         "Cross-Domain",
  "psychology":           "Psychology",
  "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics",
  "creative-practice":    "Creative Practice",
  "history":              "History",
  "african-spirituality": "African Spirituality",
  "business":             "Business",
};

// Theme-aware palette: dark (void) values inline below; parchment overrides in
// the <style> block so the page responds to the light/dark toggle.
const COLLISION_THEME_CSS = `
  .collision-root{
    --cbg:#0e0d14; --cpanel:#0a0912; --cborder:#1c1828; --cink:#e8e3f0;
    --cmuted:#8c84b0; --cdim:#3a3460; --cdim2:#2a2540; --cdim3:#4a4468; --cdim4:#6c6490;
    --cpip:rgba(255,255,255,0.08);
  }
  [data-theme="sepia"] .collision-root{
    --cbg:#f0ead8; --cpanel:#ece4d2; --cborder:#d8cdb8; --cink:#2c1f0e;
    --cmuted:#6f6048; --cdim:#9a8a6a; --cdim2:#c0b090; --cdim3:#8b7355; --cdim4:#5c4a2a;
    --cpip:rgba(44,31,14,0.12);
  }
`;

function cleanTitle(t: string) {
  return t.replace(/^Collision:\s*/i, "");
}

function parseSections(content: string): Record<string, string> {
  const body = content.replace(/^---[\s\S]*?---\n?/, "").replace(/^#[^\n]+\n/, "");
  const result: Record<string, string> = {};
  const parts = body.split(/\n##\s+/);
  parts.forEach((part) => {
    const nl = part.indexOf("\n");
    if (nl === -1) return;
    const heading = part.slice(0, nl).trim().toLowerCase();
    const text = part.slice(nl + 1).trim();
    result[heading] = text;
  });
  return result;
}

function stripMd(s: string): string {
  return s
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .trim();
}

function Pips({ score, color }: { score: number; color: string }) {
  const total = 10;
  const filled = Math.min(Math.max(Math.round((score / 14) * 10), 1), total);
  return (
    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i < filled ? color : "var(--cpip)",
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

export default async function CollisionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { nodes } = loadJSON<GraphData>("graph.json");
  const node = nodes.find((n) => n.id === slug && n.type === "collision");
  if (!node) notFound();

  const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
  const score = node.pressure_score ?? 0;
  // graph.json is content-free — read the collision body from collisions.json.
  const collisionsData = loadJSON<VaultNode[]>("collisions.json");
  const content = collisionsData.find((n) => n.id === slug)?.content ?? "";
  const sections = parseSections(content);

  const sourceTensions = sections["source tensions"] || "";
  const collisionBody  = sections["the collision"] || sections["collision"] || "";
  const candidateIdea  = sections["candidate idea"] || node.candidate_idea || "";
  const needsTrue      = sections["what would need to be true"] || "";

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const linkedNodes = node.links
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as VaultNode[];
  const backlinkedNodes = node.backlinks
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as VaultNode[];

  const FF = "var(--font-fraunces, 'Fraunces', serif)";
  const FN = "var(--font-newsreader, 'Newsreader', serif)";
  const FM = "var(--font-jetbrains, 'JetBrains Mono', monospace)";

  return (
    <div className="collision-root" style={{ minHeight: "100vh", background: "var(--cbg)", color: "var(--cink)", fontFamily: FN }}>
      <style dangerouslySetInnerHTML={{ __html: COLLISION_THEME_CSS }} />

      <NavG
        active="Collisions"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, display: "inline-block", boxShadow: `0 0 8px ${col}80`, flexShrink: 0 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: col, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{DOMAIN_LABEL[node.domain] || node.domain}</span>
          </div>
        }
      />

      {/* MAIN */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 32px 100px" }}>

        {/* D1 VOID DOSSIER */}
        <div style={{
          background: "var(--cpanel)",
          border: "1px solid var(--cborder)",
          borderRadius: 2,
          padding: "44px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Ambient orb */}
          <div style={{
            position: "absolute", top: -80, right: -80,
            width: 320, height: 320, borderRadius: "50%",
            background: col, opacity: 0.055, filter: "blur(70px)",
            pointerEvents: "none",
          }} />

          {/* Head */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 8, position: "relative",
          }}>
            <span style={{ fontFamily: FM, fontSize: 13, color: col, letterSpacing: ".12em", textTransform: "uppercase" }}>
              {DOMAIN_LABEL[node.domain] || node.domain}
            </span>
            <span style={{ fontFamily: FM, fontSize: 12, color: "var(--cdim)", letterSpacing: ".06em" }}>
              {node.created}
            </span>
          </div>

          {/* Ornament */}
          <div style={{ fontFamily: FM, fontSize: 13, color: "var(--cdim2)", letterSpacing: ".06em", marginBottom: 24, position: "relative" }}>
            — collision —
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: FF, fontStyle: "italic", fontWeight: 200,
            fontSize: 48, color: "var(--cink)",
            lineHeight: 1.05, letterSpacing: "-.02em",
            marginBottom: 24, position: "relative",
          }}>{cleanTitle(node.title)}</h1>

          {/* Excerpt */}
          <p style={{
            fontFamily: FN, fontSize: 20, color: "var(--cmuted)",
            lineHeight: 1.65, marginBottom: 32, paddingBottom: 32,
            borderBottom: "1px solid var(--cborder)", position: "relative",
          }}>{node.excerpt}</p>

          {/* Tension table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32, position: "relative" }}>
            <tbody>
              {sourceTensions && (
                <tr>
                  <td style={{
                    fontFamily: FM, fontSize: 12, color: "var(--cdim)",
                    letterSpacing: ".1em", textTransform: "uppercase",
                    width: 100, paddingRight: 20, paddingTop: 16, paddingBottom: 16,
                    verticalAlign: "top", borderTop: "1px solid var(--cborder)",
                  }}>Sources</td>
                  <td style={{
                    fontFamily: FN, fontStyle: "italic", fontSize: 17,
                    color: "var(--cmuted)", lineHeight: 1.65,
                    paddingTop: 14, paddingBottom: 16,
                    borderTop: "1px solid var(--cborder)", verticalAlign: "top",
                  }}>{stripMd(sourceTensions)}</td>
                </tr>
              )}
              {collisionBody && (
                <tr>
                  <td style={{
                    fontFamily: FM, fontSize: 12, color: "var(--cdim)",
                    letterSpacing: ".1em", textTransform: "uppercase",
                    width: 100, paddingRight: 20, paddingTop: 16, paddingBottom: 16,
                    verticalAlign: "top", borderTop: "1px solid var(--cborder)",
                  }}>Tension</td>
                  <td style={{
                    fontFamily: FN, fontStyle: "italic", fontSize: 17,
                    color: "var(--cmuted)", lineHeight: 1.65,
                    paddingTop: 14, paddingBottom: 16,
                    borderTop: "1px solid var(--cborder)", verticalAlign: "top",
                  }}>
                    {stripMd(collisionBody).slice(0, 420)}
                    {stripMd(collisionBody).length > 420 ? "…" : ""}
                  </td>
                </tr>
              )}
              {candidateIdea && (
                <tr>
                  <td style={{
                    fontFamily: FM, fontSize: 12, color: "var(--cdim)",
                    letterSpacing: ".1em", textTransform: "uppercase",
                    width: 100, paddingRight: 20, paddingTop: 16, paddingBottom: 16,
                    verticalAlign: "top", borderTop: "1px solid var(--cborder)",
                  }}>Candidate</td>
                  <td style={{
                    fontFamily: FN, fontStyle: "italic", fontSize: 17,
                    color: "var(--cmuted)", lineHeight: 1.65,
                    paddingTop: 14, paddingBottom: 16,
                    borderTop: "1px solid var(--cborder)", verticalAlign: "top",
                  }}>
                    {stripMd(candidateIdea).slice(0, 500)}
                    {stripMd(candidateIdea).length > 500 ? "…" : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer: pressure */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingTop: 8, borderTop: "1px solid var(--cborder)", position: "relative",
          }}>
            <Pips score={score} color={col} />
            <span style={{ fontFamily: FM, fontSize: 13, color: "var(--cdim3)", marginLeft: 4, letterSpacing: ".06em" }}>
              pressure {score}
            </span>
            <span style={{ fontFamily: FM, fontSize: 12, color: "var(--cdim2)", letterSpacing: ".08em", textTransform: "uppercase", marginLeft: 12 }}>
              {node.status}
            </span>
          </div>
        </div>

        {/* WHAT WOULD NEED TO BE TRUE */}
        {needsTrue && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: FM, fontSize: 12, color: "var(--cdim)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 20 }}>
              What Would Need to Be True
            </div>
            <div style={{ fontFamily: FN, fontSize: 18, color: "var(--cdim4)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
              {stripMd(needsTrue)}
            </div>
          </div>
        )}

        {/* CONNECTIONS */}
        {(linkedNodes.length > 0 || backlinkedNodes.length > 0) && (
          <div style={{ marginTop: 56 }}>
            <div style={{ fontFamily: FM, fontSize: 12, color: "var(--cdim)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 20 }}>
              Connected
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[...linkedNodes, ...backlinkedNodes]
                .filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i)
                .map((linked) => {
                  const lcol = linked.color || DOMAIN_COLOR[linked.domain] || "#8b5cf6";
                  const href =
                    linked.type === "collision" ? `/collision/${linked.id}` :
                    linked.type === "concept"   ? `/concept/${linked.id}` :
                    linked.type === "source"    ? `/source/${linked.id}` :
                    linked.type === "spark"     ? `/spark/${linked.id}` :
                    `/concept/${linked.id}`;
                  return (
                    <Link key={linked.id} href={href} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 0", borderBottom: "1px solid var(--cborder)",
                      textDecoration: "none",
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: lcol, display: "inline-block", flexShrink: 0,
                      }} />
                      <span style={{
                        fontFamily: FM, fontSize: 10, color: lcol,
                        letterSpacing: ".1em", textTransform: "uppercase",
                        flexShrink: 0, width: 120,
                      }}>{linked.type}</span>
                      <span style={{
                        fontFamily: FN, fontStyle: "italic",
                        fontSize: 16, color: "var(--cmuted)", lineHeight: 1.3,
                      }}>{linked.title}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* BACK */}
        <div style={{ marginTop: 60 }}>
          <Link href="/collisions" style={{
            fontFamily: FM, fontSize: 12, color: "var(--cdim3)",
            textDecoration: "none", letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            back to collisions
          </Link>
        </div>
      </div>
    </div>
  );
}
