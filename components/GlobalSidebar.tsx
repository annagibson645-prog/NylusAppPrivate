import { readFileSync } from "fs";
import path from "path";
import Link from "next/link";
import type { VaultStats } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function GlobalSidebar() {
  let stats: VaultStats | null = null;
  try {
    stats = loadJSON<VaultStats>("stats.json");
  } catch {
    return null;
  }

  const domains = Object.entries(stats.domains)
    .filter(([d]) => d !== "unknown")
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <aside
      className="hidden lg:flex flex-col w-52 xl:w-56 flex-shrink-0 border-r sticky top-12 self-start h-[calc(100vh-3rem)] overflow-y-auto"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="px-5 py-7 space-y-7 flex-1">

        {/* Navigation */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Navigate
          </p>
          <div className="space-y-1.5">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/domains", label: "Domains" },
              { href: "/graph", label: "Graph" },
              { href: "/workshop", label: "Workshop" },
              { href: "/collisions", label: "Collisions" },
              { href: "/sparks", label: "Sparks" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-sm py-0.5 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: "var(--border)" }} />

        {/* Domains */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Domains
          </p>
          <div className="space-y-2">
            {domains.map(([domain, data]) => (
              <Link
                key={domain}
                href={`/domain/${domain}`}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: data.color }}
                />
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--text-muted)" }}>
                  {DOMAIN_LABELS[domain] || domain}
                </span>
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                  {data.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Vault stats pinned to bottom */}
      <div className="px-5 py-5 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        {[
          { label: "Concepts", value: stats.total_concepts },
          { label: "Sources", value: stats.total_sources },
          { label: "Sparks", value: stats.total_sparks },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>{label}</span>
            <span className="text-xs tabular-nums font-medium" style={{ color: "var(--text-muted)" }}>{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
