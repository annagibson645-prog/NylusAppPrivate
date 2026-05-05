"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VaultNode } from "@/lib/types";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const BG    = "#0e0d14";
const BG2   = "#15131c";
const BG3   = "#1c1a26";
const DIM   = "#8a849a";
const DIM2  = "#494456";
const TEXT  = "#eae6f5";
const TEXT2 = "#cdc8dd";
const GOLD  = "#e8b86a";

const FF = "'Fraunces', Georgia, serif";
const FS = "'Space Grotesk', -apple-system, sans-serif";
const FM = "'JetBrains Mono', ui-monospace, monospace";

const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain":         "#14b8a6",
  "psychology":           "#3b82f6",
  "eastern-spirituality": "#8b5cf6",
  "behavioral-mechanics": "#f97316",
  "creative-practice":    "#f43f5e",
  "history":              "#f59e0b",
  "african-spirituality": "#10b981",
  "ai-collaboration":     "#06b6d4",
};
const DOMAIN_SHORT: Record<string, string> = {
  "cross-domain":         "cross",
  "psychology":           "psych",
  "eastern-spirituality": "eastern",
  "behavioral-mechanics": "behavioral",
  "creative-practice":    "creative",
  "history":              "history",
  "african-spirituality": "african",
  "ai-collaboration":     "ai",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain":         "Cross-Domain",
  "psychology":           "Psychology",
  "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics",
  "creative-practice":    "Creative Practice",
  "history":              "History",
  "african-spirituality": "African Spirituality",
  "ai-collaboration":     "AI Collaboration",
};

const DOMAINS = Object.keys(DOMAIN_COLOR);
const NAV_H   = 80;
const BLUE    = "#60a5fa";
const ARC_SZ  = 480;
const CX = 240, CY = 240, R = 155, CORE = 24;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function cleanTitle(t: string) {
  return t.replace(/^Collision:\s*/i, "");
}

function useWindowWidth() {
  const [w, setW] = useState(1400);
  useEffect(() => {
    setW(window.innerWidth);
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── SHOOTING STARS ───────────────────────────────────────────────────────────
function useShootingStars(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Star = {
      x: number; y: number; vx: number; vy: number;
      len: number; life: number; maxLife: number;
      alpha: number; hue: string;
    };
    const stars: Star[] = [];
    const palette = Object.values(DOMAIN_COLOR);

    function mkStar(): Star {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 2.2;
      const len   = 40 + Math.random() * 90;
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len, life: 0,
        maxLife: Math.round(len / speed),
        alpha: 0.5 + Math.random() * 0.35,
        hue: Math.random() < 0.3
          ? palette[Math.floor(Math.random() * palette.length)]
          : "#ffffff",
      };
    }
    for (let i = 0; i < 5; i++) stars.push(mkStar());

    let lastSpawn = 0;
    let raf: number;

    function tick(ts: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (ts - lastSpawn > 900 + Math.random() * 500) {
        stars.push(mkStar());
        lastSpawn = ts;
        if (stars.length > 12) stars.shift();
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life++;
        const tail = Math.min(s.life, s.maxLife);
        const tx = s.x - s.vx * tail;
        const ty = s.y - s.vy * tail;
        const progress = s.life / s.maxLife;
        const a = s.alpha * (1 - Math.pow(Math.max(0, progress - 0.5) * 2, 2));
        const grad = ctx!.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, s.hue === "#ffffff"
          ? `rgba(255,255,255,${a})`
          : s.hue + Math.round(a * 255).toString(16).padStart(2, "0")
        );
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(s.x, s.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 0.8 + (1 - progress) * 0.6;
        ctx!.lineCap = "round";
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 0.9, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${a * 0.9})`;
        ctx!.fill();
        s.x += s.vx;
        s.y += s.vy;
        if (
          s.x < -20 || s.x > canvas!.width + 20 ||
          s.y < -20 || s.y > canvas!.height + 20
        ) stars.splice(i, 1);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active, canvasRef]);
}

// ─── ARC ORBITAL (desktop) ────────────────────────────────────────────────────
function ArcOrbital({
  allNodes, activeDomain, onSelect,
}: {
  allNodes: VaultNode[];
  activeDomain: string | null;
  onSelect: (d: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useShootingStars(canvasRef, true);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    DOMAINS.forEach(d => { c[d] = allNodes.filter(n => n.domain === d).length; });
    return c;
  }, [allNodes]);

  const [tooltip, setTooltip] = useState<{
    label: string; count: number; color: string;
  } | null>(null);

  return (
    <div style={{ position: "relative", width: ARC_SZ, height: ARC_SZ }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <svg
        viewBox={`0 0 ${ARC_SZ} ${ARC_SZ}`}
        width={ARC_SZ} height={ARC_SZ}
        style={{ position: "relative", zIndex: 1, overflow: "visible" }}
      >
        <defs>
          <filter id="node-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="core-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="lbl-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Orbit ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>

        {/* 8 domain nodes */}
        {DOMAINS.map((domainId, i) => {
          const angle   = (i / DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
          const nx      = CX + R * Math.cos(angle);
          const ny      = CY + R * Math.sin(angle);
          const color   = DOMAIN_COLOR[domainId];
          const isActive = activeDomain === domainId;
          const isDimmed = activeDomain !== null && !isActive;
          const s       = isActive ? 13 : 10;
          const hw      = s * 0.18;
          const op      = isDimmed ? 0.18 : 0.85;
          const count   = counts[domainId] || 0;
          const short   = DOMAIN_SHORT[domainId];

          // Label
          const labelDist = s + 28;
          const lx = nx + Math.cos(angle) * labelDist;
          const ly = ny + Math.sin(angle) * labelDist;
          const deg = ((angle * 180 / Math.PI) + 360) % 360;
          const anchor = deg > 15 && deg < 165 ? "start"
                       : deg > 195 && deg < 345 ? "end"
                       : "middle";
          const textColor = isActive ? color
                          : isDimmed ? "rgba(73,68,86,0.45)"
                          : "rgba(200,196,215,0.85)";

          return (
            <g key={domainId}>
              {/* Spoke */}
              <line x1={CX} y1={CY} x2={nx} y2={ny}
                stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>

              {/* Active outer glow */}
              {isActive && (
                <g filter="url(#node-glow)">
                  <polygon
                    points={`${nx},${ny-s-5} ${nx+2},${ny} ${nx},${ny+s+5} ${nx-2},${ny}`}
                    fill={color} opacity="0.35"/>
                  <polygon
                    points={`${nx-s-5},${ny} ${nx},${ny-2} ${nx+s+5},${ny} ${nx},${ny+2}`}
                    fill={color} opacity="0.35"/>
                </g>
              )}

              {/* Hit area */}
              <circle cx={nx} cy={ny} r={20} fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setTooltip({ label: DOMAIN_LABEL[domainId], count, color })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onSelect(activeDomain === domainId ? null : domainId)}
              />

              {/* Diamond cross */}
              <g style={{ pointerEvents: "none" }}>
                <polygon
                  points={`${nx},${ny-s} ${nx+hw},${ny} ${nx},${ny+s} ${nx-hw},${ny}`}
                  fill={color} opacity={op}/>
                <polygon
                  points={`${nx-s},${ny} ${nx},${ny-hw} ${nx+s},${ny} ${nx},${ny+hw}`}
                  fill={color} opacity={op}/>
              </g>

              {/* Domain label */}
              <text
                x={lx} y={ly}
                textAnchor={anchor} dominantBaseline="middle"
                fontSize={isActive ? 13 : 12}
                fontWeight={isActive ? 600 : 400}
                fill={textColor}
                fontFamily="Space Grotesk, sans-serif"
                letterSpacing={isActive ? "0.04em" : "0.02em"}
                style={{ pointerEvents: "none", userSelect: "none" }}
                filter={isActive ? "url(#lbl-glow)" : undefined}
              >{short}</text>

              {/* Count suffix on active */}
              {isActive && (
                <text
                  x={lx + (
                    anchor === "start"  ?  short.length * 7.6 + 6
                  : anchor === "end"   ? -(short.length * 7.6 + 6)
                  : 0
                  )}
                  y={ly}
                  textAnchor={anchor} dominantBaseline="middle"
                  fontSize={10} fontWeight={400}
                  fill={color} opacity={0.65}
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >{` · ${count}`}</text>
              )}
            </g>
          );
        })}

        {/* Center — click resets to all */}
        <g
          filter="url(#core-glow)"
          style={{ cursor: "pointer" }}
          onClick={() => onSelect(null)}
          onMouseEnter={() => setTooltip({ label: "All domains", count: allNodes.length, color: GOLD })}
          onMouseLeave={() => setTooltip(null)}
        >
          <circle cx={CX} cy={CY} r={CORE} fill={BG2}
            stroke={activeDomain === null ? "rgba(232,184,106,0.4)" : "rgba(255,255,255,0.08)"}
            strokeWidth="1"/>
          <polygon
            points={`${CX},${CY-14} ${CX+2.6},${CY} ${CX},${CY+14} ${CX-2.6},${CY}`}
            fill={activeDomain === null ? GOLD : DIM2}
            opacity={activeDomain === null ? 1 : 0.6}/>
          <polygon
            points={`${CX-14},${CY} ${CX},${CY-2.6} ${CX+14},${CY} ${CX},${CY+2.6}`}
            fill={activeDomain === null ? GOLD : DIM2}
            opacity={activeDomain === null ? 1 : 0.6}/>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute", bottom: -48, left: "50%",
          transform: "translateX(-50%)",
          background: BG2, border: "1px solid rgba(232,184,106,0.2)",
          borderRadius: 8, padding: "7px 14px", textAlign: "center",
          pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: TEXT, fontFamily: FS }}>
            {tooltip.label}
          </div>
          <div style={{ fontFamily: FM, fontSize: 10, color: tooltip.color, marginTop: 2 }}>
            {tooltip.count} collisions
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MOBILE DOMAIN STRIP ──────────────────────────────────────────────────────
function MobileDomainStrip({
  activeDomain, allNodes, onSelect,
}: {
  activeDomain: string | null;
  allNodes: VaultNode[];
  onSelect: (d: string | null) => void;
}) {
  return (
    <div style={{
      display: "flex", gap: 6, alignItems: "center",
      padding: "12px 20px", overflowX: "auto",
      borderBottom: `1px solid ${BG3}`,
      // hide scrollbar
      msOverflowStyle: "none", scrollbarWidth: "none",
    }}>
      {/* All */}
      <button
        onClick={() => onSelect(null)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 999, border: "none",
          background: activeDomain === null ? BG3 : "transparent",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
          <polygon points="5,0 5.9,5 10,5 5.9,5 5,10 4.1,5 0,5 4.1,5"
            fill={GOLD} opacity={activeDomain === null ? 1 : 0.4}/>
        </svg>
        <span style={{ fontFamily: FS, fontSize: 12, color: activeDomain === null ? TEXT2 : DIM, whiteSpace: "nowrap" }}>
          all
        </span>
      </button>

      {DOMAINS.map(domainId => {
        const color   = DOMAIN_COLOR[domainId];
        const short   = DOMAIN_SHORT[domainId];
        const isActive = activeDomain === domainId;
        const s = 5, hw = s * 0.18;
        return (
          <button
            key={domainId}
            onClick={() => onSelect(isActive ? null : domainId)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${isActive ? color + "55" : "rgba(255,255,255,0.07)"}`,
              background: isActive ? color + "12" : "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
              <polygon
                points={`5,${5 - s} ${5 + hw},5 5,${5 + s} ${5 - hw},5`}
                fill={color} opacity={isActive ? 1 : 0.6}/>
              <polygon
                points={`${5 - s},5 5,${5 - hw} ${5 + s},5 5,${5 + hw}`}
                fill={color} opacity={isActive ? 1 : 0.6}/>
            </svg>
            <span style={{
              fontFamily: FS, fontSize: 12,
              color: isActive ? color : DIM,
              whiteSpace: "nowrap",
            }}>{short}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── CARD C — PULL QUOTE ──────────────────────────────────────────────────────
function CollisionCard({
  node, index, isMobile,
}: {
  node: VaultNode; index: number; isMobile: boolean;
}) {
  const col    = DOMAIN_COLOR[node.domain] || "#8b5cf6";
  const score  = node.pressure_score ?? 0;
  const isHigh = score >= 9;
  const short  = DOMAIN_SHORT[node.domain] || node.domain;
  const num    = String(index + 1).padStart(2, "0");

  return (
    <Link href={`/collision/${node.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: BG2,
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: `3px solid ${isHigh ? col : "rgba(255,255,255,0.08)"}`,
          borderRadius: 10,
          padding: isMobile ? "14px 16px" : "18px 22px",
          position: "relative", overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.18s, background 0.18s, transform 0.15s",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = "#1a1825";
          el.style.transform  = "translateX(2px)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background  = BG2;
          el.style.transform   = "translateX(0)";
          el.style.borderColor = "rgba(255,255,255,0.06)";
        }}
      >
        {/* Ghost number watermark */}
        <div style={{
          position: "absolute", right: 10, bottom: -8,
          fontFamily: FF, fontStyle: "italic", fontWeight: 700,
          fontSize: 72, color: "#fff", opacity: 0.04,
          pointerEvents: "none", lineHeight: 1, userSelect: "none",
        }}>{num}</div>

        {/* Title — small, muted label */}
        <div style={{
          fontFamily: FS, fontSize: 11, fontWeight: 500,
          color: DIM, letterSpacing: "0.01em", marginBottom: 10,
        }}>{cleanTitle(node.title)}</div>

        {/* Excerpt — Fraunces italic pull quote */}
        {node.excerpt && (
          <div style={{
            fontFamily: FF, fontStyle: "italic", fontWeight: 300,
            fontSize: isMobile ? 14 : 15, color: TEXT,
            lineHeight: 1.7, marginBottom: 14,
          }}>"{node.excerpt}"</div>
        )}

        {/* Footer: domain dot + label + pressure score */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: col, flexShrink: 0,
          }}/>
          <span style={{ fontFamily: FM, fontSize: 10, color: DIM2, letterSpacing: "0.06em" }}>
            {short}
          </span>
          <span style={{
            fontFamily: FM, fontSize: 12,
            color: isHigh ? col : DIM2, marginLeft: "auto",
          }}>
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: DIM2, opacity: 0.5 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CollisionsPage() {
  const [allNodes, setAllNodes]       = useState<VaultNode[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState<"pressure" | "date" | "alpha">("pressure");
  const winWidth  = useWindowWidth();
  const isMobile  = winWidth < 768;
  const activeCol = activeDomain ? DOMAIN_COLOR[activeDomain] : GOLD;

  useEffect(() => {
    fetch("/data/collisions.json")
      .then(r => r.json())
      .then((data: VaultNode[]) =>
        setAllNodes(data.filter(n => n.type === "collision"))
      );
  }, []);

  const filtered = useMemo(() => {
    let list = [...allNodes];
    if (activeDomain) list = list.filter(n => n.domain === activeDomain);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.excerpt || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "pressure")
      list.sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0));
    else if (sortBy === "alpha")
      list.sort((a, b) => a.title.localeCompare(b.title));
    else
      list.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    return list;
  }, [allNodes, activeDomain, search, sortBy]);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT2, fontFamily: FS }}>

      {/* ── NAV (Proto G: Fraunces italic + blue freq bars) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes navBarAnim {
          0%,100% { height: 3px; opacity: 0.4; }
          50%      { height: 10px; opacity: 1; }
        }
        .nav-freq-bars span { width: 3px; background: #60a5fa; border-radius: 1px; display: inline-block; }
        .nav-freq-bars span:nth-child(1) { animation: navBarAnim 0.9s ease-in-out infinite; }
        .nav-freq-bars span:nth-child(2) { animation: navBarAnim 0.9s ease-in-out infinite 0.15s; }
        .nav-freq-bars span:nth-child(3) { animation: navBarAnim 0.9s ease-in-out infinite 0.3s; }
        .nav-freq-bars span:nth-child(4) { animation: navBarAnim 0.9s ease-in-out infinite 0.1s; }
        .nav-freq-bars span:nth-child(5) { animation: navBarAnim 0.9s ease-in-out infinite 0.25s; }
        .nav-item-g { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 0 18px; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.07); overflow: hidden; height: 100%; text-decoration: none; transition: background 0.2s; }
        .nav-item-g:hover { background: rgba(255,255,255,0.025); }
        .nav-item-g.active-nav { background: rgba(96,165,250,0.04); }
        .nav-item-g.active-nav::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #60a5fa; box-shadow: 0 0 8px rgba(96,165,250,0.5); }
        .nav-ghost-num { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-family: 'Fraunces', Georgia, serif; font-size: 52px; font-style: italic; color: #eae6f5; opacity: 0.03; font-weight: 600; pointer-events: none; user-select: none; line-height: 1; }
        .nav-lbl-g { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-style: italic; font-weight: 300; color: #8a849a; letter-spacing: -0.01em; position: relative; z-index: 1; transition: color 0.2s; }
        .nav-item-g:hover .nav-lbl-g { color: #cdc8dd; }
        .nav-item-g.active-nav .nav-lbl-g { color: #eae6f5; font-weight: 500; }
        .nav-freq-bars { display: flex; align-items: flex-end; gap: 2px; height: 10px; opacity: 0; transition: opacity 0.25s; position: relative; z-index: 1; }
        .nav-item-g.active-nav .nav-freq-bars { opacity: 1; }
      ` }} />
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        height: NAV_H, display: "flex", alignItems: "stretch",
        background: BG2,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <Link href="/" style={{
            fontFamily: FF, fontStyle: "italic", fontWeight: 400,
            fontSize: 20, color: TEXT, textDecoration: "none", letterSpacing: "-0.02em",
          }}>Nylus</Link>
          <span style={{
            fontFamily: FM, fontSize: 8, color: DIM2,
            letterSpacing: "0.18em", textTransform: "uppercase",
            alignSelf: "flex-end", marginBottom: 16,
          }}>vault</span>
        </div>

        {/* Nav items — desktop */}
        {!isMobile && (
          <>
            {([
              { href: "/",          label: "Dashboard", idx: "01" },
              { href: "/",          label: "Domains",   idx: "02" },
              { href: "/essays",    label: "Essays",    idx: "03" },
              { href: "/workshop",  label: "Workshop",  idx: "04" },
              { href: "/collisions",label: "Collisions",idx: "05" },
              { href: "/sparks",    label: "Sparks",    idx: "06" },
              { href: "/research",  label: "Research",  idx: "07" },
            ] as const).map(({ href, label, idx }) => {
              const isActive = label === "Collisions";
              return (
                <Link
                  key={label}
                  href={href}
                  className={`nav-item-g${isActive ? " active-nav" : ""}`}
                >
                  <span className="nav-ghost-num">{idx}</span>
                  <span className="nav-lbl-g">{label}</span>
                  <div className="nav-freq-bars">
                    <span /><span /><span /><span /><span />
                  </div>
                </Link>
              );
            })}
          </>
        )}

        {/* Right — count + sort */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "0 20px", borderLeft: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ display: "flex", gap: 3 }}>
              {(["pressure", "date", "alpha"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{
                  fontFamily: FM, fontSize: 10, letterSpacing: "0.1em",
                  textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
                  border: `1px solid ${sortBy === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  background: sortBy === s ? BG3 : "transparent",
                  color: sortBy === s ? TEXT2 : DIM2,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  {s === "alpha" ? "a→z" : s}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontFamily: FF, fontStyle: "italic", fontSize: 20, color: TEXT, fontWeight: 400, lineHeight: 1 }}>
              {allNodes.length > 0 ? filtered.length : "—"}
            </span>
            <span style={{ fontFamily: FM, fontSize: 8, color: BLUE, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {allNodes.length > 0 ? `of ${allNodes.length}` : "loading"}
            </span>
          </div>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search…"
          style={{
            marginLeft: "auto", fontFamily: FM, fontSize: 12,
            background: "transparent", border: `1px solid ${BG3}`,
            borderRadius: 6, padding: "6px 12px", color: DIM,
            outline: "none", width: isMobile ? 110 : 180,
          }}
          onFocus={e => {
            e.target.style.borderColor = "rgba(232,184,106,0.3)";
            e.target.style.color = TEXT2;
          }}
          onBlur={e => {
            e.target.style.borderColor = BG3;
            e.target.style.color = DIM;
          }}
        />
      </nav>

      {/* ── MOBILE: sort strip ── */}
      {isMobile && (
        <div style={{
          display: "flex", gap: 4, padding: "10px 20px",
          borderBottom: `1px solid ${BG3}`,
        }}>
          {(["pressure", "date", "alpha"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              fontFamily: FM, fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
              border: `1px solid ${sortBy === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
              background: sortBy === s ? BG3 : "transparent",
              color: sortBy === s ? TEXT2 : DIM2, cursor: "pointer",
            }}>
              {s === "alpha" ? "a→z" : s}
            </button>
          ))}
        </div>
      )}

      {/* ── MOBILE: domain strip ── */}
      {isMobile && (
        <MobileDomainStrip
          activeDomain={activeDomain}
          allNodes={allNodes}
          onSelect={setActiveDomain}
        />
      )}

      {/* ── MOBILE: heading ── */}
      {isMobile && (
        <div style={{ padding: "20px 20px 8px" }}>
          <h1 style={{
            fontFamily: FF, fontStyle: "italic", fontWeight: 200,
            fontSize: 26, color: TEXT, marginBottom: 2,
          }}>Collisions</h1>
          <p style={{ fontSize: 12, color: activeDomain ? activeCol : DIM2 }}>
            {activeDomain
              ? `${DOMAIN_LABEL[activeDomain]} · ${filtered.length}`
              : `all domains · ${allNodes.length}`}
          </p>
        </div>
      )}

      {/* ── DESKTOP: arc section ── */}
      {!isMobile && (
        <section style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "44px 40px 36px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{
            fontFamily: FM, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: activeDomain ? activeCol : DIM2,
            marginBottom: 6, transition: "color 0.3s",
          }}>
            {activeDomain
              ? `⊹ ${DOMAIN_SHORT[activeDomain]} · ${filtered.length} collisions`
              : "⊹ navigate by domain"}
          </div>

          <h1 style={{
            fontFamily: FF, fontStyle: "italic", fontWeight: 200,
            fontSize: 30, color: TEXT, marginBottom: 4,
          }}>Collisions</h1>

          <p style={{ fontSize: 12, color: DIM2, marginBottom: 36, textAlign: "center" }}>
            ideas at the fault lines —{" "}
            <span style={{ color: activeCol, fontWeight: 500, transition: "color 0.3s" }}>
              {activeDomain ? DOMAIN_LABEL[activeDomain] : "view all"}
            </span>
          </p>

          <ArcOrbital
            allNodes={allNodes}
            activeDomain={activeDomain}
            onSelect={setActiveDomain}
          />

          <p style={{ fontSize: 11, color: DIM2, marginTop: 36, textAlign: "center" }}>
            click a domain star to filter · click center or active star to reset
          </p>
        </section>
      )}

      {/* ── RESULTS STRIP ── */}
      <div style={{
        fontFamily: FM, fontSize: 11, color: DIM2,
        padding: isMobile ? "8px 20px 4px" : "14px 40px 4px",
      }}>
        <span style={{ color: GOLD }}>{filtered.length}</span>
        {" collisions"}
        {activeDomain && (
          <span style={{ color: activeCol }}> · {DOMAIN_LABEL[activeDomain]}</span>
        )}
      </div>

      {/* ── CARD LIST ── */}
      <div style={{
        padding: isMobile ? "12px 16px 80px" : "12px 40px 80px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            fontFamily: FF, fontStyle: "italic", fontSize: 18, color: DIM2,
          }}>no collisions found</div>
        ) : (
          filtered.map((node, idx) => (
            <CollisionCard key={node.id} node={node} index={idx} isMobile={isMobile} />
          ))
        )}
      </div>
    </div>
  );
}
