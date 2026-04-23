"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";


function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M11.07 2.93l-1.06 1.06M3.99 10.01l-1.06 1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M11.5 8.5A5 5 0 015.5 2.5a5.002 5.002 0 000 9 5 5 0 006-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("nyluss-theme", next ? "light" : "dark"); } catch {}
  }

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        {/* Main nav bar */}
        <div className="flex items-center gap-4 px-4 sm:px-6 h-12">
          {/* Wordmark */}
          <Link href="/" className="font-semibold text-sm tracking-tight flex-shrink-0" style={{ color: "var(--text)" }}>
            NylusS
          </Link>

          <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ background: "var(--border)" }} />

          {/* Desktop primary nav */}
          <div className="hidden sm:flex items-center gap-5">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/graph", label: "Graph" },
              { href: "/workshop", label: "Workshop" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm transition-colors"
                style={{ color: isActive(href) ? "var(--text)" : "var(--text-muted)" }}
              >
                {label}
              </Link>
            ))}

            <Link
              href="/domains"
              className="text-sm transition-colors"
              style={{ color: pathname.startsWith("/domain") ? "var(--text)" : "var(--text-muted)" }}
            >
              Domains
            </Link>
          </div>

          <div className="flex-1" />

          {/* Right controls — always visible */}
          <button
            onClick={toggleTheme}
            className="transition-colors p-1.5 rounded"
            style={{ color: "var(--text-muted)" }}
            title={light ? "Switch to dark mode" : "Switch to light mode"}
          >
            {light ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Search — icon only on mobile, icon+text on desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
            <kbd
              className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{ color: "var(--text-dim)", borderColor: "var(--border)" }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="sm:hidden p-1.5 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="sm:hidden border-t px-4 py-3 space-y-1"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {[
              { href: "/", label: "Dashboard" },
              { href: "/graph", label: "Graph" },
              { href: "/workshop", label: "Workshop" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block py-2 text-sm transition-colors"
                style={{ color: isActive(href) ? "var(--text)" : "var(--text-muted)" }}
              >
                {label}
              </Link>
            ))}

            <Link
              href="/domains"
              className="block py-2 text-sm transition-colors"
              style={{ color: pathname.startsWith("/domain") ? "var(--text)" : "var(--text-muted)" }}
            >
              Domains
            </Link>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
