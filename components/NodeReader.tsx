"use client";
import Link from "next/link";
import { marked } from "marked";
import { useState, useEffect } from "react";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

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
        return `<a href="${href}" class="void-link">${display}</a>`;
      }
      return `<span class="void-link-broken" title="Not in vault: ${target}">${display}</span>`;
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

const DOMAIN_FULL: Record<string, string> = {
  history: "History",
  "eastern-spirituality": "Eastern Spirituality",
  psychology: "Psychology",
  "behavioral-mechanics": "Behavioral Mechanics",
  "cross-domain": "Cross-Domain",
  "creative-practice": "Creative Practice",
  "african-spirituality": "African Spirituality",
  "ai-collaboration": "AI Collaboration",
  unknown: "Other",
};

const DOMAIN_BACK: Record<string, string> = {
  history: "History",
  "eastern-spirituality": "Eastern",
  psychology: "Psychology",
  "behavioral-mechanics": "Behavioral",
  "cross-domain": "Cross-Domain",
  "creative-practice": "Creative",
  "african-spirituality": "African",
  "ai-collaboration": "AI",
  unknown: "Other",
};

export default function NodeReader({ node, backlinkedNodes, nodeTypes }: Props) {
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

  const html = renderContent(node.content, nodeTypes);
  const hasConnections = backlinkedNodes.length > 0 || node.links.length > 0;

  const typeRoute = (n: VaultNode) => routeForType(n.type, n.id);

  return (
    <div className="void-page" style={{ '--domain-color': node.color } as React.CSSProperties}>

      {/* Reading progress */}
      <div className="void-progress-track">
        <div className="void-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Ambient glow */}
      <div className="void-ambient" />

      {/* Nav */}
      <nav className="void-nav">
        <Link href="/" className="void-nav-brand">lotusmind</Link>
        <div className="void-nav-right">
          <Link href="/" className="void-nav-back">← galaxy</Link>
          <a
            href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(node.path)}`}
            className="void-nav-obsidian"
          >
            obsidian ↗
          </a>
        </div>
      </nav>

      {/* Content */}
      <div className="concept-outer">

        {/* Sidebar — backlinks */}
        {backlinkedNodes.length > 0 && (
          <aside className="concept-sidebar">
            <div className="csb-label">Backlinks</div>
            {backlinkedNodes.map((n) => (
              <Link key={n.id} href={typeRoute(n)} className="csb-item">
                <span className="csb-domain">{DOMAIN_BACK[n.domain] || n.domain}</span>
                {n.title}
              </Link>
            ))}
          </aside>
        )}

        <div className="void-content">

        {/* Domain chip */}
        <div className="void-domain-chip">
          {DOMAIN_FULL[node.domain] || node.domain}
        </div>

        {/* Title */}
        <h1 className="void-title">{node.title}</h1>

        {/* Lede — excerpt as styled intro */}
        {node.excerpt && (
          <div className="void-lede">{node.excerpt}</div>
        )}

        {/* Status + meta */}
        <div className="void-meta-inline">
          <span className="void-meta-status" style={{ color: node.color }}>
            {node.status}
          </span>
          <span className="void-meta-dot">·</span>
          <span className="void-meta-type">{node.type}</span>
          {node.sources > 0 && (
            <>
              <span className="void-meta-dot">·</span>
              <span className="void-meta-type">{node.sources} {node.sources === 1 ? "source" : "sources"}</span>
            </>
          )}
          {node.updated && (
            <>
              <span className="void-meta-dot">·</span>
              <span className="void-meta-type">{formatDate(node.updated)}</span>
            </>
          )}
        </div>

        {/* Ornament */}
        <div className="void-ornament">
          <div className="void-ornament-line" />
          <span className="void-ornament-glyph">✦</span>
          <div className="void-ornament-line" />
        </div>

        {/* Body content */}
        <div
          className="void-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Tensions — if structured data exists */}
        {node.tension_a && node.tension_b && (
          <>
            <div className="void-section-label">tensions</div>
            <div className="void-tension-pair">
              <div className="void-tension-side">{node.tension_a}</div>
              <div className="void-tension-vs">VS</div>
              <div className="void-tension-side">{node.tension_b}</div>
            </div>
          </>
        )}

        {/* Live wire */}
        {node.live_wire && (
          <>
            <div className="void-section-label">live edge</div>
            <div className="void-live-wire">{node.live_wire}</div>
          </>
        )}

        {/* Connections */}
        {hasConnections && (
          <>
            <div className="void-section-label">connected concepts</div>
            <div className="void-connections-grid">
              {backlinkedNodes.slice(0, 8).map((n) => (
                <Link key={n.id} href={typeRoute(n)} className="void-conn-cell">
                  <div className="void-conn-domain" style={{ color: n.color }}>
                    {DOMAIN_BACK[n.domain] || n.domain}
                  </div>
                  <div className="void-conn-title">{n.title}</div>
                </Link>
              ))}
              {node.links.slice(0, 8).map((id) => (
                <Link key={id} href={`/concept/${id}`} className="void-conn-cell">
                  <div className="void-conn-domain">→ link</div>
                  <div className="void-conn-title">{id.replace(/-/g, " ")}</div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Hub membership */}
        {node.hub && (
          <div className="void-hub-row">
            <span className="void-hub-label">hub</span>
            <Link href={`/concept/${node.hub}`} className="void-hub-link">
              ↑ {node.hub.replace(/-hub$/, "").replace(/-/g, " ")}
            </Link>
          </div>
        )}

        {/* Metadata strip */}
        <div className="void-meta-strip">
          <div className="void-meta-item">
            <span className="void-meta-k">domain</span>
            <span className="void-meta-v">{DOMAIN_FULL[node.domain] || node.domain}</span>
          </div>
          <div className="void-meta-item">
            <span className="void-meta-k">status</span>
            <span className="void-meta-v" style={{ color: node.color }}>{node.status}</span>
          </div>
          {node.sources > 0 && (
            <div className="void-meta-item">
              <span className="void-meta-k">sources</span>
              <span className="void-meta-v">{node.sources}</span>
            </div>
          )}
          {node.created && (
            <div className="void-meta-item">
              <span className="void-meta-k">created</span>
              <span className="void-meta-v">{formatDate(node.created)}</span>
            </div>
          )}
          {backlinkedNodes.length > 0 && (
            <div className="void-meta-item">
              <span className="void-meta-k">inbound links</span>
              <span className="void-meta-v">{backlinkedNodes.length}</span>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}
