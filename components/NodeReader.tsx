"use client";
import Link from "next/link";
import { marked } from "marked";
import { useState, useEffect, useRef } from "react";
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
  if (type === "essay" || type === "research" || type === "craft") return `/${type}/${slug}`;
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
  "business": "Business",
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
  "business": "Business",
  unknown: "Other",
};

function complexityScore(sources: number, backlinks: number): number {
  return Math.min(5, Math.max(1, sources + Math.floor(backlinks / 4)));
}

function ConceptLotus({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Parse hex → rgb components
    const hex = color.startsWith("#") ? color : "#a78bfa";
    const cr = parseInt(hex.slice(1, 3), 16);
    const cg = parseInt(hex.slice(3, 5), 16);
    const cb = parseInt(hex.slice(5, 7), 16);
    // Lighter tint for center glow and petal veins
    const lr = Math.min(255, cr + 80);
    const lg = Math.min(255, cg + 80);
    const lb = Math.min(255, cb + 80);

    const W = 640, H = 640;
    let t = 0;
    let bloom = 0;
    let raf: number;

    const drawPetal = (cx: number, cy: number, r: number, angle: number, openAngle: number, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const g = ctx.createRadialGradient(0, -r * 0.3, 0, 0, -r * 0.5, r * 0.8);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.72})`);
      g.addColorStop(0.5, `rgba(${Math.max(0, cr - 30)},${Math.max(0, cg - 30)},${Math.max(0, cb - 30)},${alpha * 0.42})`);
      g.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.4 * Math.cos(openAngle), -r * 0.6, -r * 0.5, -r * 0.9, 0, -r);
      ctx.bezierCurveTo(r * 0.5, -r * 0.9, r * 0.4 * Math.cos(openAngle), -r * 0.6, 0, 0);
      ctx.fillStyle = g;
      ctx.fill();
      // Petal vein
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 0.85);
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha * 0.28})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      bloom = Math.min(1, bloom + 0.004);
      t += 0.01;

      const cx = W / 2, cy = H / 2, base = W * 0.4;
      const oa = bloom * Math.PI * 0.38;

      // Water ripple rings
      for (let i = 1; i <= 5; i++) {
        const rr = base * (0.9 + i * 0.18) + Math.sin(t * 0.8 + i) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${Math.max(0, 0.04 - i * 0.006)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Outer petals (16)
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + t * 0.003;
        drawPetal(cx, cy, base * (0.75 + Math.sin(t * 0.5 + i) * 0.02), a, oa, 0.32 * bloom);
      }
      // Middle petals (8)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8 + t * 0.005;
        drawPetal(cx, cy, base * (0.52 + Math.sin(t * 0.6 + i) * 0.015), a, oa * 0.85, 0.5 * bloom);
      }
      // Inner petals (4)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + t * 0.008;
        drawPetal(cx, cy, base * 0.32, a, oa * 0.6, 0.65 * bloom);
      }

      // Center bindu glow
      const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.1);
      cGrad.addColorStop(0, `rgba(${lr},${lg},${lb},0.48)`);
      cGrad.addColorStop(1, "transparent");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.1, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={640}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(640px, 82vw)",
        height: "min(640px, 82vw)",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.9,
      }}
    />
  );
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
      <style>{`
        .void-spine-track {
          position: fixed;
          left: 0; top: 0;
          width: 2px; height: 100vh;
          z-index: 20;
          pointer-events: none;
        }
        .void-spine-fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          transition: height 0.07s linear;
        }
        .void-spine-tip {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 7px; height: 7px;
          border-radius: 50%;
          transition: top 0.07s linear;
        }
        @media (max-width: 768px) {
          .void-spine-track { display: none; }
        }
      `}</style>

      {/* Reading progress bar — top */}
      <div className="void-progress-track">
        <div className="void-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Reading spine — left edge, gradient fills with scroll */}
      <div
        className="void-spine-track"
        style={{ background: `${c}10` }}
      >
        <div
          className="void-spine-fill"
          style={{
            height: `${progress}%`,
            background: `linear-gradient(to bottom,
              transparent 0%,
              ${c}28 15%,
              ${c}66 55%,
              ${c}cc 85%,
              ${c} 100%)`,
          }}
        />
        {progress > 0.5 && (
          <div
            className="void-spine-tip"
            style={{
              top: `${progress}%`,
              background: c,
              boxShadow: `0 0 10px ${c}, 0 0 22px ${c}77`,
            }}
          />
        )}
      </div>

      <div className="void-ambient" />

      {/* Lotus background — fixed center, domain color */}
      <ConceptLotus color={c} />

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
        <Link href="/hubs" className="void-ghost-back">
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
          {hasConnections && (() => {
            const essayBacks = backlinkedNodes.filter((n) => n.type === "essay" || n.type === "research" || n.type === "craft");
            const otherBacks = backlinkedNodes.filter((n) => n.type !== "essay" && n.type !== "research" && n.type !== "craft");
            return (
              <>
                {/* Essays / research / craft reports that grew from this node */}
                {essayBacks.length > 0 && (
                  <>
                    <div className="void-section-label">developed into</div>
                    <div className="void-connections-grid">
                      {essayBacks.map((n) => (
                        <Link key={n.id} href={typeRoute(n)} className="void-conn-cell">
                          <div className="void-conn-domain" style={{ color: n.color }}>
                            {n.type === "research" ? "⊹ research" : n.type === "craft" ? "✎ craft" : "✦ essay"}
                          </div>
                          <div className="void-conn-title">{n.title}</div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {(otherBacks.length > 0 || node.links.length > 0) && (
                  <>
                    <div className="void-section-label">connected concepts</div>
                    <div className="void-connections-grid">
                      {otherBacks.slice(0, 8).map((n) => (
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
              </>
            );
          })()}

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
