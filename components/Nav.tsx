"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";
import { DOMAIN_LABELS } from "@/lib/types";

const DOMAINS = Object.keys(DOMAIN_LABELS).filter((d) => d !== "unknown");

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

export default function Nav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [domainsOpen, setDomainsOpen] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

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
        className="sticky top-0 z-40 flex items-center gap-6 px-6 h-12 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        {/* Wordmark */}
        <Link href="/" className="font-semibold text-sm tracking-tight flex-shrink-0" style={{ color: "var(--text)" }}>
          NylusS
        </Link>

        <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--border)" }} />

        {/* Primary nav */}
        <div className="flex items-center gap-5">
          {[
            { href: "/", label: "Dashboard" },
            { href: "/graph", label: "Graph" },
            { href: "/timeline", label: "Timeline" },
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

          {/* Domains dropdown */}
          <div className="relative">
            <button
              onClick={() => setDomainsOpen((o) => !o)}
              className="text-sm transition-colors"
              style={{ color: pathname.startsWith("/domain") ? "var(--text)" : "var(--text-muted)" }}
            >
              Domains
            </button>
            {domainsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDomainsOpen(false)} />
                <div
                  className="absolute top-full left-0 mt-2 py-1 rounded-lg border z-50 min-w-[180px]"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {DOMAINS.map((d) => (
                    <Link
                      key={d}
                      href={`/domain/${d}`}
                      onClick={() => setDomainsOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors hover:opacity-80"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {DOMAIN_LABELS[d]}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="transition-colors p-1.5 rounded"
          style={{ color: "var(--text-muted)" }}
          title={light ? "Switch to dark mode" : "Switch to light mode"}
        >
          {light ? <MoonIcon /> : <SunIcon />}
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>Search</span>
          <kbd
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
            style={{ color: "var(--text-dim)", borderColor: "var(--border)" }}
          >
            ⌘K
          </kbd>
        </button>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
