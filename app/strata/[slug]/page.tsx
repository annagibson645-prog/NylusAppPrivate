import { idsOfFile, loadVaultJSON } from "@/lib/vault-json";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import NavG from "@/components/NavG";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return idsOfFile("worldview.json").map((slug) => ({ slug }));
}

const ACCENT = "#c9836a";

const DOMAIN_COLORS: Record<string, string> = {
  "eastern-spirituality": "#dc2626",
  history: "#e6c068",
  "cross-domain": "#38bdf8",
  psychology: "#f59e0b",
  "behavioral-mechanics": "#a78bfa",
  "creative-practice": "#14b8a6",
  "african-spirituality": "#34d399",
  business: "#e879a0",
  occult: "#d95ae8",
};

function loadJSON<T>(file: string): T {
  return loadVaultJSON<T>(file);
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
  if (type === "worldview") return `/strata/${slug}`;
  if (type === "research" || type === "essay" || type === "craft") return `/${type}/${slug}`;
  return `/concept/${slug}`;
}

// Split the report at its "# Below the Line" divider so the two halves can be
// styled differently — sourced above, speculative below.
function splitAtLine(raw: string): { above: string; below: string } {
  const body = raw
    .replace(/^---[\s\S]*?---\n?/, "")
    // the file's own H1 duplicates the page title
    .replace(/^\s*#\s+(?!Below the Line\b).+\n/, "");
  const idx = body.search(/^#\s+Below the Line\s*$/m);
  if (idx === -1) return { above: body, below: "" };
  return { above: body.slice(0, idx), below: body.slice(idx) };
}

function renderContent(body: string, nodeTypes: Map<string, string>): string {
  let out = body.replace(
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
  out = out.replace(/^\[\^[^\]]+\]:.+$/gm, "");
  out = out.replace(/\[\^([^\]]+)\]/g, "<sup>$1</sup>");
  return marked.parse(out) as string;
}

export default async function StrataSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let reports: any[] = [];
  try {
    reports = loadJSON<any[]>("worldview.json");
  } catch {
    notFound();
  }

  const report = reports.find((r) => r.id === slug);
  if (!report) notFound();

  let nodeTypes = new Map<string, string>();
  try {
    const graph = loadJSON<{ nodes: { id: string; type: string }[] }>("graph.json");
    nodeTypes = new Map(graph.nodes.map((n) => [n.id, n.type]));
  } catch { /* links render as plain text if the graph is unavailable */ }

  const domainColor = DOMAIN_COLORS[report.domain] ?? ACCENT;
  const { above, below } = splitAtLine(report.content ?? "");
  const aboveHtml = renderContent(above, nodeTypes);
  const belowHtml = below ? renderContent(below.replace(/^#\s+Below the Line\s*$/m, ""), nodeTypes) : "";
  const mins = readMins(report.word_count);

  return (
    <>
      <NavG active="Strata" />
      <div className="void-page" style={{ "--domain-color": domainColor } as React.CSSProperties}>
        <div className="void-ambient" />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto", padding: "56px clamp(20px, 5vw, 64px) 160px" }}>

          <Link href="/strata" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
            color: "#494456", textDecoration: "none", marginBottom: "48px",
          }}>
            ← The Strata
          </Link>

          <div className="void-domain-chip">
            {report.domain && report.domain !== "unknown" ? report.domain.replace(/-/g, " ") : "worldview"}
          </div>

          <h1 className="void-title">
            {String(report.title ?? "").replace(/\s*[—–-]\s*Worldview Archaeology\s*$/i, "").trim()}
          </h1>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "56px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", letterSpacing: "0.08em" }}>
            {report.created && <span>{formatDate(report.created)}</span>}
            {mins && <span>{mins} min read</span>}
            {report.word_count && <span>{report.word_count.toLocaleString()} words</span>}
            {report.status && <span style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>{report.status}</span>}
          </div>

          {/* ── Above the line: sourced ─────────────────────────── */}
          <article
            className="void-prose"
            dangerouslySetInnerHTML={{ __html: aboveHtml }}
            style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "18px", lineHeight: 1.85, color: "#c8c0d8" }}
          />

          {/* ── Below the line: speculative ─────────────────────── */}
          {belowHtml && (
            <section style={{ marginTop: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                <span style={{
                  fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px",
                  letterSpacing: "0.24em", textTransform: "uppercase", color: ACCENT,
                  whiteSpace: "nowrap", opacity: 0.85,
                }}>
                  below the line
                </span>
                <span style={{
                  flex: 1, height: "1px",
                  backgroundImage: `repeating-linear-gradient(90deg, ${ACCENT} 0 6px, transparent 6px 12px)`,
                  opacity: 0.35,
                }} />
              </div>

              <p style={{
                fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px",
                lineHeight: 1.7, color: "#6a6478", letterSpacing: "0.02em",
                margin: "0 0 40px", maxWidth: "60ch",
              }}>
                Everything above is sourced to the text. Everything here is built rather than found —
                roads not taken, counsel from other traditions, and what transfers. Speculation is the
                job in this half, and it is exempt from the vault&rsquo;s assessment gate.
              </p>

              <article
                className="void-prose"
                dangerouslySetInnerHTML={{ __html: belowHtml }}
                style={{
                  fontFamily: "var(--font-newsreader), serif", fontSize: "18px",
                  lineHeight: 1.85, color: "#a9a2ba",
                  borderLeft: `1px solid rgba(201,131,106,0.25)`,
                  paddingLeft: "clamp(16px, 3vw, 32px)",
                }}
              />
            </section>
          )}

        </div>
      </div>
    </>
  );
}
