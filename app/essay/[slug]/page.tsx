import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import type { VaultNode } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function formatDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(wordCount?: number) {
  if (!wordCount) return null;
  return `${Math.max(1, Math.round(wordCount / 220))} min read`;
}

function slugFromWikilink(target: string): string {
  return target.split("/").pop()!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function routeForType(type: string, slug: string): string {
  if (type === "spark") return `/spark/${slug}`;
  if (type === "source") return `/source/${slug}`;
  if (type === "collision") return `/collision/${slug}`;
  if (type === "thread") return `/threads/${slug}`;
  if (type === "research" || type === "essay" || type === "craft") return `/${type}/${slug}`;
  return `/concept/${slug}`;
}

// Render the essay body: turn [[wikilinks]] into real links (or a "broken" span
// if the target isn't in the vault), strip footnote definitions, then markdown.
function renderEssay(raw: string, nodeTypes: Map<string, string>): string {
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

type SlimNode = { id: string; type: string; title: string; domain?: string; color?: string; links?: string[] };

export default async function EssayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let essays: VaultNode[] = [];
  try {
    essays = loadJSON<VaultNode[]>("essays.json");
  } catch {
    notFound();
  }

  const essay = essays.find((e) => e.id === slug);
  if (!essay) notFound();

  // Graph gives us link targets + their titles/types (for wikilink routing and
  // the "Sparked by" block). The essay's own `links` come from frontmatter
  // `spark:`/`sparks:` and any [[wikilinks]] in the body.
  let nodeTypes = new Map<string, string>();
  let byId = new Map<string, SlimNode>();
  try {
    const graph = loadJSON<{ nodes: SlimNode[] }>("graph.json");
    nodeTypes = new Map(graph.nodes.map((n) => [n.id, n.type]));
    byId = new Map(graph.nodes.map((n) => [n.id, n]));
  } catch { /* links render as plain text if graph is unavailable */ }

  const links = (byId.get(essay.id)?.links ?? essay.links ?? []) as string[];
  const sparkLinks = links
    .map((id) => byId.get(id))
    .filter((n): n is SlimNode => !!n && n.type === "spark");

  const html = renderEssay(essay.content, nodeTypes);

  return (
    <div className="void-page">
      <div className="void-ambient" />

      <div className="void-layout">
        <div className="void-layout-main">

          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5" style={{ color: "var(--text)", fontFamily: "var(--font-fraunces), serif" }}>
              {essay.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-dim)" }}>
              {essay.created && <span>{formatDate(essay.created)}</span>}
              {essay.word_count && (
                <>
                  <span>·</span>
                  <span>{essay.word_count.toLocaleString()} words</span>
                  <span>·</span>
                  <span>{readTime(essay.word_count)}</span>
                </>
              )}
              {essay.status && (
                <>
                  <span>·</span>
                  <span className="capitalize text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                    {essay.status}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mb-12 h-px" style={{ background: "var(--border)" }} />

          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Sparked by — the spark(s) this essay grew from */}
          {sparkLinks.length > 0 && (
            <div className="mt-16 pt-7 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: "var(--text-dim)", fontFamily: "var(--font-jetbrains), monospace" }}>
                {sparkLinks.length === 1 ? "Sparked by" : "Sparked by"}
              </div>
              <div className="flex flex-col gap-2">
                {sparkLinks.map((s) => (
                  <Link
                    key={s.id}
                    href={`/spark/${s.id}`}
                    className="group flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <span aria-hidden style={{ color: s.color || "#5fc9a8", fontSize: 14, flexShrink: 0 }}>⚡</span>
                    <span style={{ color: "var(--text)", fontFamily: "var(--font-fraunces), serif", fontStyle: "italic", fontSize: 17 }}>
                      {s.title}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: "var(--text-dim)" }}>view spark →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-20 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
            <Link href="/essays" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
              ← All essays
            </Link>
          </div>
        </div>

        <aside className="void-right-nav">
          <div className="vrn-toggle">
            <ThemeToggle />
          </div>
          <Link href="/" className="vrn-brand">NylusS</Link>
          <div className="vrn-sep" />
          <Link href="/" className="vrn-link">← constellation</Link>
          <Link href="/essays" className="vrn-link">← all essays</Link>
          {sparkLinks.map((s) => (
            <Link key={s.id} href={`/spark/${s.id}`} className="vrn-link">⚡ {s.title} →</Link>
          ))}
          {essay.path && (
            <a href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(essay.path)}`} className="vrn-link">
              obsidian ↗
            </a>
          )}
          <div className="vrn-sep" />
          <Link href="/collisions" className="vrn-link">collisions →</Link>
          <Link href="/sparks" className="vrn-link">sparks →</Link>
        </aside>
      </div>
    </div>
  );
}
