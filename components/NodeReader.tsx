"use client";
import Link from "next/link";
import { marked } from "marked";
import { useState, useEffect } from "react";
import type { VaultNode } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  node: VaultNode;
  backlinkedNodes: VaultNode[];
  nodeTypes: Map<string, string>;
  domainSiblings?: VaultNode[];
}

function slugFromWikilink(target: string): string {
  return target.split("/").pop()!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

function complexityScore(sources: number, backlinks: number): number {
  return Math.min(5, Math.max(1, sources + Math.floor(backlinks / 4)));
}

export default function NodeReader({ node, backlinkedNodes, nodeTypes, domainSiblings = [] }: Props) {
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
  const complexity = complexityScore(node.sources, backlinkedNodes.length);
  const domainLabel = DOMAIN_FULL[node.domain] || node.domain;
  const domainShort = DOMAIN_BACK[node.domain] || node.domain;

  const c = node.color;

  return (
    <div className="void-page" style={{ "--domain-color": c } as React.CSSProperties}>
      {/* Reading progress */}
      <div className="void-progress-track">
        <div className="void-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="void-ambient" />

      {/* ── GHOST HERO: fixed left spine (mobile only) ─────────────── */}
      <div className="void-ghost-spine">
        {/* Fading glow line */}
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: "50%",
          width: 1,
          background: `linear-gradient(to bottom, ${c}, ${c}88, ${c}35, transparent 85%)`,
          transform: "translateX(-50%)",
          boxShadow: `0 0 8px ${c}55`,
        }} />
        {/* Hollow outline box */}
        <div style={{
          position: "absolute", top: 14, bottom: 14, left: 8, right: 8,
          border: `0.5px solid ${c}40`,
          borderRadius: 3,
          background: "transparent",
        }} />
        {/* Domain label */}
        <span style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%) rotate(-90deg)",
          whiteSpace: "nowrap",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8, letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: `${c}95`,
        }}>
          {domainShort}
        </span>
      </div>

      {/* ── GHOST HERO: fading gradient header (mobile only) ────────── */}
      <div
        className="void-ghost-hero"
        style={{
          background: `linear-gradient(to bottom, ${c} 0%, ${c}d0 28%, ${c}45 60%, transparent 100%)`,
        }}
      >
        {/* Back link */}
        <Link href="/domains" className="void-ghost-back">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {domainShort}
        </Link>

        {/* Title */}
        <h1 className="void-ghost-title">{node.title}</h1>

        {/* Complexity dots */}
        <div className="void-ghost-dots">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="void-ghost-dot"
              style={{
                background: i <= complexity ? "rgba(255,255,255,0.92)" : "transparent",
                border: `1.5px solid ${i <= complexity ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.28)"}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Layout: main content + right nav */}
      <div className="void-layout">

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="void-layout-main">

          {/* Domain chip — desktop only */}
          <div className="void-domain-chip">
            {domainLabel}
          </div>

          {/* Title — desktop only */}
          <h1 className="void-title">{node.title}</h1>

          {/* Lede — desktop only */}
          {node.excerpt && (
            <div className="void-lede">{node.excerpt}</div>
          )}

          {/* Meta */}
          <div className="void-meta-inline">
            <span className="void-meta-status" style={{ color: c }}>{node.status}</span>
            <span className="void-meta-dot">·</span>
            <span className="void-meta-type">{node.type}</span>
            {node.sources > 0 && (
              <>
                <span className="void-meta-dot">·</span>
                <span className="void-meta-type">{node.sources} {node.sources === 1 ? "source" : "sources"}</span>
              </>
            )}
            <span className="void-meta-dot void-complexity-desktop">·</span>
            <span className="void-complexity-desktop" style={{ display: "inline-flex", gap: 3, alignItems: "center", verticalAlign: "middle" }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{
                  display: "inline-block",
                  width: 5, height: 5,
                  borderRadius: "50%",
                  background: i <= complexity ? c : "transparent",
                  border: `1px solid ${i <= complexity ? c : c + "55"}`,
                  opacity: i <= complexity ? 0.9 : 0.3,
                }} />
              ))}
            </span>
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

          {/* Body */}
          <div className="void-prose" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Tensions */}
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

          {/* Hub */}
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
              <span className="void-meta-v">{domainLabel}</span>
            </div>
            <div className="void-meta-item">
              <span className="void-meta-k">status</span>
              <span className="void-meta-v" style={{ color: c }}>{node.status}</span>
            </div>
            {node.sources > 0 && (
              <div className="void-meta-item">
                <span className="void-meta-k">sources</span>
                <span className="void-meta-v">{node.sources}</span>
              </div>
            )}
            <div className="void-meta-item">
              <span className="void-meta-k">complexity</span>
              <span className="void-meta-v" style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{
                    display: "inline-block",
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: i <= complexity ? c : "transparent",
                    border: `1px solid ${i <= complexity ? c : c + "55"}`,
                    opacity: i <= complexity ? 0.9 : 0.3,
                  }} />
                ))}
              </span>
            </div>
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

        {/* ── Right nav ─────────────────────────────────────────────── */}
        <aside className="void-right-nav">
          <div className="vrn-toggle">
            <ThemeToggle />
          </div>

          <Link href="/" className="vrn-brand">NylusS</Link>

          <div className="vrn-sep" />

          <Link href="/" className="vrn-link">← constellation</Link>
          <a
            href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(node.path)}`}
            className="vrn-link"
          >
            obsidian ↗
          </a>

          {domainSiblings.length > 0 && (
            <>
              <div className="vrn-sep" />
              <span className="vrn-domain-label">
                {domainLabel}
              </span>
              {domainSiblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/concept/${s.id}`}
                  className={`vrn-sibling${s.id === node.id ? " vrn-sibling-current" : ""}`}
                  title={s.title}
                >
                  {s.title}
                </Link>
              ))}
            </>
          )}

          <div className="vrn-sep" />
          <Link href="/collisions" className="vrn-link">collisions →</Link>
          <Link href="/sparks" className="vrn-link">sparks →</Link>

          {backlinkedNodes.length > 0 && (
            <>
              <span className="vrn-section-label">backlinks</span>
              {backlinkedNodes.slice(0, 6).map((n) => (
                <Link key={n.id} href={typeRoute(n)} className="vrn-sibling" title={n.title}>
                  {n.title}
                </Link>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
