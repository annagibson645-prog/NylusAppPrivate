"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import VaultSearch from "@/components/VaultSearch";

// ─── Proto G nav — Fraunces italic + blue frequency bars ─────────────────────
// Drop into any page: <NavG active="collisions" />
// Optional right slot for breadcrumbs, domain chips, etc.
// Theme toggle is built-in — works on all screen sizes.

const NAV_ITEMS = [
  { label: "Dashboard",  idx: "01", href: "/"           },
  { label: "Hubs",       idx: "02", href: "/hubs"       },
  { label: "Research",   idx: "03", href: "/research"   },
  { label: "Essays",     idx: "04", href: "/essays"     },
  { label: "Collisions", idx: "05", href: "/collisions" },
  { label: "Sparks",     idx: "06", href: "/sparks"     },
  { label: "Tomes",      idx: "07", href: "/tones"      },
  { label: "The Council", idx: "08", href: "/council"   },
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
    border-right: 1px solid var(--navg-border, rgba(255,255,255,0.07));
    overflow: hidden; background: transparent;
    text-decoration: none; transition: background 0.2s;
    flex-shrink: 0;
  }
  .navg-item:hover { background: var(--navg-item-hover, rgba(255,255,255,0.025)); }
  .navg-item.navg-active { background: rgba(96,165,250,0.06); }
  .navg-item.navg-active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: #60a5fa;
    box-shadow: 0 0 8px rgba(96,165,250,0.5);
  }
  .navg-ghost {
    position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
    font-family: 'Fraunces', Georgia, serif; font-size: 52px; font-style: italic;
    color: var(--navg-ghost-color, #eae6f5);
    opacity: var(--navg-ghost-opacity, 0.03);
    font-weight: 600;
    pointer-events: none; user-select: none; line-height: 1;
  }
  .navg-lbl {
    font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-style: italic;
    font-weight: 300; color: var(--navg-lbl, #8a849a); letter-spacing: -0.01em;
    position: relative; z-index: 1; transition: color 0.2s; white-space: nowrap;
  }
  .navg-item:hover .navg-lbl { color: var(--navg-lbl-hover, #cdc8dd); }
  .navg-item.navg-active .navg-lbl { color: var(--navg-lbl-active, #eae6f5); font-weight: 500; }
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
  .navg-search {
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 4px;
    padding: 6px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--navg-lbl, #8a849a);
    width: 148px;
    outline: none;
    transition: border-color 0.2s, background 0.2s, width 0.25s cubic-bezier(0.16,1,0.3,1);
    letter-spacing: 0.06em;
  }
  .navg-search::placeholder { color: var(--navg-dim, #494456); }
  .navg-search:focus {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.055);
    width: 200px;
    color: var(--navg-lbl-hover, #cdc8dd);
  }
  .navg-theme-btn {
    background: none; border: none; border-radius: 4px;
    padding: 6px; cursor: pointer;
    color: var(--navg-dim, #494456);
    display: flex; align-items: center; justify-content: center;
    line-height: 1; transition: color 0.2s; flex-shrink: 0;
  }
  .navg-theme-btn:hover { color: var(--navg-lbl-hover, #cdc8dd); }
`;

interface NavGProps {
  active: typeof NAV_ITEMS[number]["label"] | (string & {});
  right?: React.ReactNode;
  count?: { value: number | string; label: string; color?: string };
}

export default function NavG({ active, right, count }: NavGProps) {
  const [theme, setTheme] = useState<'void' | 'sepia'>('void');

  useEffect(() => {
    // Sync React state with whatever the no-flash script already applied
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'sepia' || current === 'void') {
      setTheme(current);
    } else {
      // No saved preference — check localStorage directly
      const saved = localStorage.getItem('nylus-theme') as 'void' | 'sepia' | null;
      if (saved) setTheme(saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'void' ? 'sepia' : 'void';
    setTheme(next);
    localStorage.setItem('nylus-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="navg-root" style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 80, display: "flex", alignItems: "stretch",
        background: "var(--navg-bg, #15131c)",
        borderBottom: "1px solid var(--navg-border, rgba(255,255,255,0.07))",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 24px",
          borderRight: "1px solid var(--navg-border, rgba(255,255,255,0.07))",
          flexShrink: 0, textDecoration: "none",
        }}>
          <span style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 20,
            color: "var(--navg-text, #eae6f5)",
            letterSpacing: "-0.02em",
          }}>Nylus</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "var(--navg-dim, #494456)",
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
          borderLeft: "1px solid var(--navg-border, rgba(255,255,255,0.07))",
          flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ width: 180 }}>
            <VaultSearch
              placeholder="search…"
              showTypes={['concept', 'hub', 'collision', 'spark', 'source', 'essay']}
              colors={{
                bg:      'rgba(13,11,24,0.99)',
                border:  'rgba(255,255,255,0.10)',
                ink:     '#eae6f5',
                ink2:    '#8a849a',
                card:    'rgba(255,255,255,0.035)',
                cardHov: 'rgba(255,255,255,0.07)',
              }}
            />
          </div>

          {right}
          {count && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic", fontSize: 20,
                color: "var(--navg-text, #eae6f5)", fontWeight: 400, lineHeight: 1,
              }}>{count.value}</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8, color: count.color ?? "#60a5fa",
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}>{count.label}</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            className="navg-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'void' ? 'Switch to parchment mode' : 'Switch to void mode'}
            title={theme === 'void' ? 'Parchment' : 'Void'}
          >
            {theme === 'void' ? (
              /* Sun — shown in dark mode, click to go light */
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="0.5" y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="12.5" y1="7.5" x2="14.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="2.7" y1="2.7" x2="4.1" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="10.9" y1="10.9" x2="12.3" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="12.3" y1="2.7" x2="10.9" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="4.1" y1="10.9" x2="2.7" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Moon — shown in light mode, click to go dark */
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 2C4.46 2 2 4.46 2 7.5C2 10.54 4.46 13 7.5 13C9.9 13 11.6 11.4 12.3 9.3C11.6 9.6 10.8 9.8 9.9 9.8C6.9 9.8 4.5 7.4 4.5 4.4C4.5 3.3 4.9 2.3 5.5 1.5C6.2 1.8 7 2 7.5 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
