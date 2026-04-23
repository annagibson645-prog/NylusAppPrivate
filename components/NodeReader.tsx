"use client";
import Link from "next/link";
import { marked } from "marked";
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
  const typeRoute = (n: VaultNode) => {
    if (n.type === "spark") return `/spark/${n.id}`;
    if (n.type === "collision") return `/collision/${n.id}`;
    if (n.type === "source") return `/source/${n.id}`;
    return `/concept/${n.id}`;
  };

  const html = renderContent(node.content, allIds);

  return (
    <div className="flex min-h-screen justify-center">
      {/* Main reading area */}
      <div className="flex-1 min-w-0 px-10 py-10" style={{ maxWidth: "52rem" }}>

        {/* Breadcrumb + meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-8 text-xs text-slate-600">
          <Link
            href={`/domain/${node.domain}`}
            className="hover:text-slate-400 transition-colors"
            style={{ color: node.color }}
          >
            {DOMAIN_LABELS[node.domain] || node.domain}
          </Link>
          <span>/</span>
          <span
            className="capitalize"
            style={{ color: STATUS_COLORS[node.status] || "#6b7280" }}
          >
            {node.status}
          </span>
          <span>/</span>
          <span className="text-slate-700">{node.type}</span>
          {node.sources > 0 && (
            <>
              <span>/</span>
              <span className="text-slate-700">{node.sources} {node.sources === 1 ? "source" : "sources"}</span>
            </>
          )}
          {node.created && (
            <>
              <span>/</span>
              <span className="text-slate-700">{node.created}</span>
            </>
          )}
          <span className="ml-auto">
            <a
              href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(node.path)}`}
              className="text-slate-700 hover:text-slate-400 transition-colors"
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
      </div>

      {/* Relationship sidebar */}
      <aside
        className="w-56 flex-shrink-0 border-l px-5 py-10 space-y-8 sticky top-12 self-start max-h-[calc(100vh-3rem)] overflow-y-auto"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Hub membership */}
        {node.hub && (
          <section>
            <h3 className="text-[10px] font-medium text-slate-700 uppercase tracking-widest mb-2">Hub</h3>
            <Link
              href={`/concept/${node.hub}`}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ↑ {node.hub.replace(/-hub$/, "").replace(/-/g, " ")}
            </Link>
          </section>
        )}

        {/* Backlinks */}
        {backlinkedNodes.length > 0 && (
          <section>
            <h3 className="text-[10px] font-medium text-slate-700 uppercase tracking-widest mb-2">
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
                      <div className="text-xs text-slate-500 group-hover:text-slate-200 transition-colors leading-snug">
                        {n.title}
                      </div>
                      <div className="text-[10px] text-slate-700 mt-0.5">
                        {DOMAIN_LABELS[n.domain] || n.domain}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {backlinkedNodes.length > 15 && (
                <p className="text-[10px] text-slate-700">+{backlinkedNodes.length - 15} more</p>
              )}
            </div>
          </section>
        )}

        {/* Outbound links */}
        {node.links.length > 0 && (
          <section>
            <h3 className="text-[10px] font-medium text-slate-700 uppercase tracking-widest mb-2">
              Links out ({node.links.length})
            </h3>
            <div className="space-y-1.5">
              {node.links.slice(0, 12).map((id) => (
                <Link
                  key={id}
                  href={`/concept/${id}`}
                  className="block text-xs text-slate-600 hover:text-slate-300 transition-colors truncate"
                >
                  {id.replace(/-/g, " ")}
                </Link>
              ))}
              {node.links.length > 12 && (
                <p className="text-[10px] text-slate-700">+{node.links.length - 12} more</p>
              )}
            </div>
          </section>
        )}

        {/* Domain breadcrumb */}
        <section className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/domain/${node.domain}`}
            className="text-xs text-slate-700 hover:text-slate-400 transition-colors"
          >
            ← All {DOMAIN_LABELS[node.domain] || node.domain}
          </Link>
        </section>
      </aside>
    </div>
  );
}
