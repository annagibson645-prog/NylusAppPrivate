import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import NavG from "@/components/NavG";

export const dynamic = "force-dynamic";

const ACCENT = "#14b8a6";

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readMins(wc?: number) {
  return wc ? Math.max(1, Math.round(wc / 220)) : null;
}

function slugFromWikilink(target: string): string {
  return target.split("/").pop()!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function routeForType(type: string, slug: string): string {
  if (type === "source") return `/source/${slug}`;
  if (type === "spark") return `/spark/${slug}`;
  if (type === "collision") return `/collision/${slug}`;
  if (type === "thread") return `/threads/${slug}`;
  if (type === "research" || type === "essay" || type === "craft") return `/${type}/${slug}`;
  return `/concept/${slug}`;
}

function renderContent(raw: string, nodeTypes: Map<string, string>): string {
  let body = raw.replace(/^---[\s\S]*?---\n?/, "");
  body = body.replace(
    /\[\[([^\]|#\n]+?)(?:\|([^\]\n]+))?\]\]/g,
    (_m, target: string, alias?: string) => {
      const display = alias?.trim() || target.split("/").pop() || target;
      const slug = slugFromWikilink(target);
      if (nodeTypes.has(slug)) {
        return `<a href="${routeForType(nodeTypes.get(slug)!, slug)}" class="void-link">${display}</a>`;
      }
      return `<span class="void-link-broken" title="Not in vault: ${target}">${display}</span>`;
    }
  );
  body = body.replace(/^\[\^[^\]]+\]:.+$/gm, "");
  body = body.replace(/\[\^([^\]]+)\]/g, "<sup>$1</sup>");
  return marked.parse(body) as string;
}

function techniqueLabel(t: string) {
  return t.replace(/-/g, " ");
}

export default async function CraftSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let reports: any[] = [];
  try {
    reports = loadJSON<any[]>("craft.json");
  } catch {
    notFound();
  }

  const report = reports.find((r) => r.id === slug);
  if (!report) notFound();

  let nodeTypes = new Map<string, string>();
  try {
    const graph = loadJSON<{ nodes: { id: string; type: string }[] }>("graph.json");
    nodeTypes = new Map(graph.nodes.map((n) => [n.id, n.type]));
  } catch { /* links will render as plain text if graph is unavailable */ }

  const html = renderContent(report.content ?? "", nodeTypes);
  const mins = readMins(report.word_count);

  return (
    <>
      <NavG active="Craft Reports" />
      <div className="void-page" style={{ "--domain-color": ACCENT } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto", padding: "56px clamp(20px, 5vw, 64px) 160px" }}>

        {/* ── Back ──────────────────────────────────────────────── */}
        <Link href="/craft" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "#494456", textDecoration: "none", marginBottom: "48px",
        }}>
          ← Craft Reports
        </Link>

        {/* ── Domain chip ───────────────────────────────────────── */}
        <div className="void-domain-chip">craft session</div>

        {/* ── Title ─────────────────────────────────────────────── */}
        <h1 className="void-title">{report.title}</h1>

        {report.source_material && (
          <p style={{
            fontFamily: "var(--font-newsreader), serif",
            fontStyle: "italic", fontSize: "17px",
            color: "#a09080", marginBottom: "24px", marginTop: "-12px",
          }}>
            from {report.source_material}
          </p>
        )}

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "28px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", letterSpacing: "0.08em" }}>
          {report.created && <span>{formatDate(report.created)}</span>}
          {mins && <span>{mins} min read</span>}
          {report.word_count && <span>{report.word_count.toLocaleString()} words</span>}
          <span style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>{report.status}</span>
        </div>

        {/* ── Technique chips ───────────────────────────────────── */}
        {report.techniques && report.techniques.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "56px" }}>
            {report.techniques.map((t: string) => (
              <span key={t} style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase",
                color: ACCENT,
                border: `1px solid color-mix(in srgb, ${ACCENT} 35%, transparent)`,
                borderRadius: "3px", padding: "4px 10px",
                background: `color-mix(in srgb, ${ACCENT} 7%, transparent)`,
              }}>
                {techniqueLabel(t)}
              </span>
            ))}
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        <article
          className="void-prose"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: "18px",
            lineHeight: 1.85,
            color: "#c8c0d8",
          }}
        />

      </div>
      </div>
    </>
  );
}
