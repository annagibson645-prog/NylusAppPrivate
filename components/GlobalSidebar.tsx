"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VaultStats } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

export default function GlobalSidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<VaultStats | null>(null);

  useEffect(() => {
    fetch("/data/stats.json").then((r) => r.json()).then(setStats);
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/domains", label: "Domains" },
    { href: "/workshop", label: "Workshop" },
    { href: "/collisions", label: "Collisions" },
    { href: "/sparks", label: "Sparks" },
    { href: "/sources", label: "Sources" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const domains = stats
    ? Object.entries(stats.domains)
        .filter(([d]) => d !== "unknown")
        .sort(([, a], [, b]) => b.count - a.count)
    : [];

  return (
    <aside
      className="hidden lg:flex flex-col w-52 xl:w-56 flex-shrink-0 border-r sticky top-12 self-start h-[calc(100vh-3rem)] overflow-y-auto"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="px-4 py-7 space-y-7 flex-1">

        {/* Navigation */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-2 px-2.5" style={{ color: "var(--text-dim)" }}>
            Navigate
          </p>
          <div className="space-y-0.5">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors"
                  style={{
                    color: active ? "var(--text)" : "var(--text-muted)",
                    background: active ? "var(--surface-2)" : "transparent",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="h-px" style={{ background: "var(--border)" }} />

        {/* Domains */}
        {domains.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-2 px-2.5" style={{ color: "var(--text-dim)" }}>
              Domains
            </p>
            <div className="space-y-0.5">
              {domains.map(([domain, data]) => {
                const active = pathname === `/domain/${domain}` || pathname.startsWith(`/domain/${domain}/`);
                return (
                  <Link
                    key={domain}
                    href={`/domain/${domain}`}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors"
                    style={{
                      background: active ? "var(--surface-2)" : "transparent",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: data.color }} />
                    <span className="text-sm flex-1 min-w-0 truncate" style={{ color: active ? "var(--text)" : "var(--text-muted)" }}>
                      {DOMAIN_LABELS[domain] || domain}
                    </span>
                    <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                      {data.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Vault stats */}
      {stats && (
        <div className="px-5 py-5 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Concepts", value: stats.total_concepts },
            { label: "Sources", value: stats.total_sources },
            { label: "Sparks", value: stats.total_sparks },
            { label: "Collisions", value: stats.total_collisions },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between">
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>{label}</span>
              <span className="text-xs tabular-nums font-medium" style={{ color: "var(--text-muted)" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
