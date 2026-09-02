import { idsOfFile, loadVaultJSON } from "@/lib/vault-json";
import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import NavG from "@/components/NavG";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return idsOfFile("threads.json").map((slug) => ({ slug }));
}

const DOMAIN_COLORS: Record<string, string> = {
  "eastern-spirituality": "#dc2626",
  "history":              "#e6c068",
  "cross-domain":         "#38bdf8",
  "psychology":           "#f59e0b",
  "behavioral-mechanics": "#a78bfa",
  "creative-practice":    "#14b8a6",
  "african-spirituality": "#34d399",
  "business":             "#e879a0",
  "occult":               "#d95ae8",
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
  if (type === "research" || type === "essay" || type === "craft") return `/${type}/${slug}`;
  return `/concept/${slug}`;
}

function renderContent(raw: string, nodeTypes: Map<string, string>): string {
  let body = raw.replace(/^---[\s\S]*?---\n?/, "");
  // [[wikilinks]] → real links (or a "broken" span if the page isn't in the vault)
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
  // strip footnote definitions, turn footnote refs into superscripts
  body = body.replace(/^\[\^[^\]]+\]:.+$/gm, "");
  body = body.replace(/\[\^([^\]]+)\]/g, "<sup>$1</sup>");
  return marked.parse(body) as string;
}

export default async function ThreadSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let threads: any[] = [];
  try {
    threads = loadJSON<any[]>("threads.json");
  } catch {
    notFound();
  }

  const thread = threads.find((r) => r.id === slug);
  if (!thread) notFound();

  let nodeTypes = new Map<string, string>();
  try {
    const graph = loadJSON<{ nodes: { id: string; type: string }[] }>("graph.json");
    nodeTypes = new Map(graph.nodes.map((n) => [n.id, n.type]));
  } catch { /* links will render as plain text if graph is unavailable */ }

  const domainColor = DOMAIN_COLORS[thread.domain] ?? "#c084fc";
  const html        = renderContent(thread.content ?? "", nodeTypes);
  const mins        = readMins(thread.word_count);

  return (
    <>
      <NavG active="Threads" />
      <div className="void-page" style={{ "--domain-color": domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto", padding: "56px clamp(20px, 5vw, 64px) 160px" }}>

        {/* ── Back ──────────────────────────────────────────────── */}
        <Link href="/threads" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "#494456", textDecoration: "none", marginBottom: "48px",
          transition: "color 0.2s",
        }}>
          ← Threads
        </Link>

        {/* ── Domain chip ───────────────────────────────────────── */}
        <div className="void-domain-chip">
          {thread.domain !== "unknown" ? thread.domain.replace(/-/g, " ") : "thread"}
        </div>

        {/* ── Title ─────────────────────────────────────────────── */}
        <h1 className="void-title">{thread.title}</h1>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "56px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", letterSpacing: "0.08em" }}>
          {thread.created && <span>{formatDate(thread.created)}</span>}
          {mins && <span>{mins} min read</span>}
          {thread.word_count && <span>{thread.word_count.toLocaleString()} words</span>}
          <span style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>{thread.status}</span>
        </div>

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
