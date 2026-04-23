"use client";
import Link from "next/link";
import { marked } from "marked";
import { useState } from "react";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS, STATUS_COLORS } from "@/lib/types";

interface Props {
  node: VaultNode;
  backlinkedNodes: VaultNode[];
  allIds: Set<string>;
}

function slugFromWikilink(target: string): string {
  return target
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderContent(raw: string, allIds: Set<string>): string {
  let body = raw.replace(/^---[\s\S]*?---\n?/, "");

  body = body.replace(
    /\[\[([^\]|#\n]+?)(?:\|([^\]\n]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const display = alias?.trim() || target.split("/").pop() || target;
      const slug = slugFromWikilink(target);
      if (allIds.has(slug)) {
        return `<a href="/concept/${slug}" class="wiki-link">${display}</a>`;
      }
      return `<span class="wiki-link-broken" title="Not in vault: ${target}">${display}</span>`;
    }
  );

  body = body.replace(/^\[\^[^\]]+\]:.+$/gm, "");
  body = body.replace(/\[\^([^\]]+)\]/g, "<sup>$1</sup>");

  return marked.parse(body) as string;
}

export default function NodeReader({ node, backlinkedNodes, allIds }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const typeRoute = (n: VaultNode) => {
    if (n.type === "spark") return `/spark/${n.id}`;
    if (n.type === "collision") return `/collision/${n.id}`;
    if (n.type === "source") return `/source/${n.id}`;
    return `/concept/${n.id}`;
  };

  const html = renderContent(node.content, allIds);

  const hasSidebar = node.hub || backlinkedNodes.length > 0 || node.links.length > 0;

  return (
    <div className="flex min-h-screen justify-center relative">
      {/* Main reading area */}
      <div className="flex-1 min-w-0 px-4 sm:px-8 md:px-10 py-8 sm:py-10" style={{ maxWidth: "52rem" }}>

        {/* Breadcrumb + meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-6 sm:mb-8 text-xs">
          <Link
            href={`/domain/${node.domain}`}
            className="hover:opacity-70 transition-opacity"
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
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span style={{ color: "var(--text-muted)" }}>{node.type}</span>
          {node.sources > 0 && (
            <>
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <span style={{ color: "var(--text-muted)" }}>{node.sources} {node.sources === 1 ? "source" : "sources"}</span>
            </>
          )}
          {node.created && (
            <>
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <span style={{ color: "var(--text-muted)" }}>{node.created}</span>
            </>
          )}
          <span className="ml-auto flex items-center gap-3">
            {hasSidebar && (
              <button
                className="md:hidden text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setSidebarOpen((o) => !o)}
              >
                {sidebarOpen ? "Hide links" : "Show links"}
              </button>
            )}
            <a
              href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(node.path)}`}
              className="hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              Open in Obsidian ↗
            </a>
          </span>
        </div>

        {/* Rendered markdown */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Mobile sidebar — shown inline below content */}
        {hasSidebar && sidebarOpen && (
          <div
            className="md:hidden mt-10 pt-8 border-t space-y-8"
            style={{ borderColor: "var(--border)" }}
          >
            <SidebarContent node={node} backlinkedNodes={backlinkedNodes} typeRoute={typeRoute} />
          </div>
        )}
      </div>

      {/* Desktop relationship sidebar */}
      {hasSidebar && (
        <aside
          className="hidden md:block w-56 flex-shrink-0 border-l px-5 py-10 space-y-8 sticky top-12 self-start max-h-[calc(100vh-3rem)] overflow-y-auto"
          style={{ borderColor: "var(--border)" }}
        >
          <SidebarContent node={node} backlinkedNodes={backlinkedNodes} typeRoute={typeRoute} />
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
          <h3 className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Hub</h3>
          <Link
            href={`/concept/${node.hub}`}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            ↑ {node.hub.replace(/-hub$/, "").replace(/-/g, " ")}
          </Link>
        </section>
      )}

      {/* Backlinks */}
      {backlinkedNodes.length > 0 && (
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Backlinks ({backlinkedNodes.length})
          </h3>
          <div className="space-y-2.5">
            {backlinkedNodes.slice(0, 15).map((n) => (
              <Link key={n.id} href={typeRoute(n)} className="block group">
                <div className="flex items-start gap-1.5">
                  <span
                    className="mt-1 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: n.color }}
                  />
                  <div>
                    <div className="text-xs group-hover:opacity-70 transition-opacity leading-snug" style={{ color: "var(--text-muted)" }}>
                      {n.title}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                      {DOMAIN_LABELS[n.domain] || n.domain}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {backlinkedNodes.length > 15 && (
              <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>+{backlinkedNodes.length - 15} more</p>
            )}
          </div>
        </section>
      )}

      {/* Outbound links */}
      {node.links.length > 0 && (
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Links out ({node.links.length})
          </h3>
          <div className="space-y-1.5">
            {node.links.slice(0, 12).map((id) => (
              <Link
                key={id}
                href={`/concept/${id}`}
                className="block text-xs hover:opacity-70 transition-opacity truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {id.replace(/-/g, " ")}
              </Link>
            ))}
            {node.links.length > 12 && (
              <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>+{node.links.length - 12} more</p>
            )}
          </div>
        </section>
      )}

      {/* Domain breadcrumb */}
      <section className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <Link
          href={`/domain/${node.domain}`}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          ← All {DOMAIN_LABELS[node.domain] || node.domain}
        </Link>
      </section>
    </>
  );
}
