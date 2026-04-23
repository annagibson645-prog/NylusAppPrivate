"use client";
import Link from "next/link";
import { marked } from "marked";
import { useState } from "react";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS, STATUS_COLORS } from "@/lib/types";

interface Props {
  node: VaultNode;
  backlinkedNodes: VaultNode[];
  nodeTypes: Map<string, string>;
}

function slugFromWikilink(target: string): string {
  return target
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function routeForType(type: string, slug: string): string {
  if (type === "source") return `/source/${slug}`;
  if (type === "spark") return `/spark/${slug}`;
  if (type === "collision") return `/collision/${slug}`;
  return `/concept/${slug}`;
}

function renderContent(raw: string, nodeTypes: Map<string, string>): string {
  let body = raw.replace(/^---[\s\S]*?---\n?/, "");

  body = body.replace(
    /\[\[([^\]|#\n]+?)(?:\|([^\]\n]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const display = alias?.trim() || target.split("/").pop() || target;
      const slug = slugFromWikilink(target);
      if (nodeTypes.has(slug)) {
        const href = routeForType(nodeTypes.get(slug)!, slug);
        return `<a href="${href}" class="wiki-link">${display}</a>`;
      }
      return `<span class="wiki-link-broken" title="Not in vault: ${target}">${display}</span>`;
    }
  );

  body = body.replace(/^\[\^[^\]]+\]:.+$/gm, "");
  body = body.replace(/\[\^([^\]]+)\]/g, "<sup>$1</sup>");

  return marked.parse(body) as string;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NodeReader({ node, backlinkedNodes, nodeTypes }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const typeRoute = (n: VaultNode) => routeForType(n.type, n.id);

  const html = renderContent(node.content, nodeTypes);
  const hasSidebar = node.hub || backlinkedNodes.length > 0 || node.links.length > 0;

  return (
    <div className="flex min-h-screen">
      {/* Reading progress bar */}
      <div className="fixed top-12 left-0 right-0 z-30 h-0.5" style={{ background: "var(--border)" }}>
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: node.color,
            transition: "width 80ms linear",
          }}
        />
      </div>
      {/* Main reading area — centered within its flex space */}
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full px-6 sm:px-12 md:px-16 py-12 sm:py-16" style={{ maxWidth: "52rem" }}>

          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-8 text-sm">
            <Link
              href={`/domain/${node.domain}`}
              className="font-medium hover:opacity-70 transition-opacity"
              style={{ color: node.color }}
            >
              {DOMAIN_LABELS[node.domain] || node.domain}
            </Link>
            <span style={{ color: "var(--text-dim)" }}>/</span>
            <span
              className="capitalize"
              style={{ color: STATUS_COLORS[node.status] || "#6b7280" }}
            >
              {node.status}
            </span>
            {node.created && (
              <>
                <span style={{ color: "var(--text-dim)" }}>/</span>
                <span style={{ color: "var(--text-muted)" }}>{formatDate(node.created)}</span>
              </>
            )}
            <span className="ml-auto flex items-center gap-4">
              {hasSidebar && (
                <button
                  className="md:hidden text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() => setSidebarOpen((o) => !o)}
                >
                  {sidebarOpen ? "Hide links" : "Show links"}
                </button>
              )}
              <a
                href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(node.path)}`}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-dim)" }}
              >
                Open in Obsidian ↗
              </a>
            </span>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2 mb-12">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
              style={{
                color: STATUS_COLORS[node.status] || "#6b7280",
                background: (STATUS_COLORS[node.status] || "#6b7280") + "18",
              }}
            >
              {node.status}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full capitalize"
              style={{ color: "var(--text-muted)", background: "var(--surface)" }}
            >
              {node.type}
            </span>
            {node.sources > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ color: "var(--text-muted)", background: "var(--surface)" }}
              >
                {node.sources} {node.sources === 1 ? "source" : "sources"}
              </span>
            )}
          </div>

          {/* Rendered markdown */}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Mobile sidebar */}
          {hasSidebar && sidebarOpen && (
            <div
              className="md:hidden mt-12 pt-10 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <SidebarContent node={node} backlinkedNodes={backlinkedNodes} typeRoute={typeRoute} />
            </div>
          )}
        </div>
      </div>

      {/* Desktop relationship sidebar */}
      {hasSidebar && (
        <aside
          className="hidden md:flex flex-col w-64 flex-shrink-0 border-l sticky top-12 self-start max-h-[calc(100vh-3rem)] overflow-y-auto"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="px-6 py-10 space-y-8">
            <SidebarContent node={node} backlinkedNodes={backlinkedNodes} typeRoute={typeRoute} />
          </div>
        </aside>
      )}
    </div>
  );
}

function SidebarContent({
  node,
  backlinkedNodes,
  typeRoute,
}: {
  node: VaultNode;
  backlinkedNodes: VaultNode[];
  typeRoute: (n: VaultNode) => string;
}) {
  return (
    <>
      {/* Hub membership */}
      {node.hub && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Hub</p>
          <Link
            href={`/concept/${node.hub}`}
            className="text-sm hover:opacity-70 transition-opacity leading-snug block"
            style={{ color: "var(--text-muted)" }}
          >
            ↑ {node.hub.replace(/-hub$/, "").replace(/-/g, " ")}
          </Link>
        </section>
      )}

      {/* Backlinks */}
      {backlinkedNodes.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Backlinks · {backlinkedNodes.length}
          </p>
          <div className="space-y-3">
            {backlinkedNodes.slice(0, 15).map((n) => (
              <Link key={n.id} href={typeRoute(n)} className="block group">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: n.color }}
                  />
                  <span className="text-sm leading-snug group-hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
                    {n.title}
                  </span>
                </div>
              </Link>
            ))}
            {backlinkedNodes.length > 15 && (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>+{backlinkedNodes.length - 15} more</p>
            )}
          </div>
        </section>
      )}

      {/* Outbound links */}
      {node.links.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Links out · {node.links.length}
          </p>
          <div className="space-y-2.5">
            {node.links.slice(0, 12).map((id) => (
              <Link
                key={id}
                href={`/concept/${id}`}
                className="block text-sm hover:opacity-70 transition-opacity leading-snug capitalize"
                style={{ color: "var(--text-muted)" }}
              >
                {id.replace(/-/g, " ")}
              </Link>
            ))}
            {node.links.length > 12 && (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>+{node.links.length - 12} more</p>
            )}
          </div>
        </section>
      )}

      {/* Domain link */}
      <section className="pt-5 border-t" style={{ borderColor: "var(--border)" }}>
        <Link
          href={`/domain/${node.domain}`}
          className="text-sm hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-dim)" }}
        >
          ← All {DOMAIN_LABELS[node.domain] || node.domain}
        </Link>
      </section>
    </>
  );
}
