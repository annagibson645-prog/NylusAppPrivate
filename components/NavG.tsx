"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Proto G nav — Fraunces italic + blue frequency bars ─────────────────────
// Drop into any page: <NavG active="collisions" />
// Optional right slot for breadcrumbs, domain chips, etc.

const BG2  = "#15131c";
const DIM2 = "#494456";
const TEXT = "#eae6f5";

const NAV_ITEMS = [
  { label: "dashboard",  idx: "01", href: "/"           },
  { label: "domains",    idx: "02", href: "/"           },
  { label: "essays",     idx: "03", href: "/essays"     },
  { label: "workshop",   idx: "04", href: "/workshop"   },
  { label: "collisions", idx: "05", href: "/collisions" },
  { label: "sparks",     idx: "06", href: "/sparks"     },
  { label: "research",   idx: "07", href: "/research"   },
] as const;

const STYLES = `
  @keyframes navGBar {
    0%,100% { height: 3px; opacity: 0.4; }
    50%      { height: 10px; opacity: 1; }
  }
  .navg-item {
    position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 5px;
    padding: 0 18px; cursor: pointer; height: 100%;
    border-right: 1px solid rgba(255,255,255,0.07);
    overflow: hidden; background: transparent;
    text-decoration: none; transition: background 0.2s;
    flex-shrink: 0;
  }
  .navg-item:hover { background: rgba(255,255,255,0.025); }
  .navg-item.navg-active { background: rgba(96,165,250,0.04); }
  .navg-item.navg-active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: #60a5fa;
    box-shadow: 0 0 8px rgba(96,165,250,0.5);
  }
  .navg-ghost {
    position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
    font-family: 'Fraunces', Georgia, serif; font-size: 52px; font-style: italic;
    color: #eae6f5; opacity: 0.03; font-weight: 600;
    pointer-events: none; user-select: none; line-height: 1;
  }
  .navg-lbl {
    font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-style: italic;
    font-weight: 300; color: #8a849a; letter-spacing: -0.01em;
    position: relative; z-index: 1; transition: color 0.2s; white-space: nowrap;
  }
  .navg-item:hover .navg-lbl { color: #cdc8dd; }
  .navg-item.navg-active .navg-lbl { color: #eae6f5; font-weight: 500; }
  .navg-bars {
    display: flex; align-items: flex-end; gap: 2px; height: 10px;
    opacity: 0; transition: opacity 0.25s; position: relative; z-index: 1;
  }
  .navg-item.navg-active .navg-bars { opacity: 1; }
  .navg-bars span {
    width: 3px; background: #60a5fa; border-radius: 1px; display: inline-block;
  }
  .navg-bars span:nth-child(1) { animation: navGBar 0.9s ease-in-out infinite; }
  .navg-bars span:nth-child(2) { animation: navGBar 0.9s ease-in-out infinite 0.15s; }
  .navg-bars span:nth-child(3) { animation: navGBar 0.9s ease-in-out infinite 0.3s; }
  .navg-bars span:nth-child(4) { animation: navGBar 0.9s ease-in-out infinite 0.1s; }
  .navg-bars span:nth-child(5) { animation: navGBar 0.9s ease-in-out infinite 0.25s; }
`;

interface NavGProps {
  active: typeof NAV_ITEMS[number]["label"] | (string & {});
  right?: React.ReactNode;
  count?: { value: number | string; label: string; color?: string };
}

export default function NavG({ active, right, count }: NavGProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 80, display: "flex", alignItems: "stretch",
        background: BG2,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0, textDecoration: "none",
        }}>
          <span style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 20, color: TEXT, letterSpacing: "-0.02em",
          }}>Nylus</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, color: DIM2,
            letterSpacing: "0.18em", textTransform: "uppercase",
            alignSelf: "flex-end", marginBottom: 16,
          }}>vault</span>
        </Link>

        {/* Nav items */}
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
          {NAV_ITEMS.map(({ label, idx, href }) => (
            <Link
              key={label}
              href={href}
              className={`navg-item${label === active ? " navg-active" : ""}`}
            >
              <span className="navg-ghost">{idx}</span>
              <span className="navg-lbl">{label}</span>
              <div className="navg-bars">
                <span /><span /><span /><span /><span />
              </div>
            </Link>
          ))}
        </div>

        {/* Right slot */}
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center",
          gap: 12, padding: "0 20px",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          {right}
          {count && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic", fontSize: 20,
                color: TEXT, fontWeight: 400, lineHeight: 1,
              }}>{count.value}</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8, color: count.color ?? "#60a5fa",
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}>{count.label}</span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
