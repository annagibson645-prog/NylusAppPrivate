import CollisionCard from "@/components/CollisionCard";
import SparkCard from "@/components/SparkCard";
import type { VaultNode, VaultStats } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";
import Link from "next/link";
import { readFileSync } from "fs";
import path from "path";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function Dashboard() {
  const collisions = loadJSON<VaultNode[]>("collisions.json");
  const sparks = loadJSON<VaultNode[]>("sparks.json");
  const stats = loadJSON<VaultStats>("stats.json");

  const staleCount = sparks.filter((s) => s.age_days > 30).length;
  const essaySeeds = sparks.filter((s) => s.subtype === "essay-seed");
  const topCollisions = collisions.slice(0, 8);
  const topSparks = sparks.slice(0, 10);

  const domains = Object.entries(stats.domains)
    .filter(([d]) => d !== "unknown")
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <div className="flex min-h-screen">

      {/* TOC Sidebar — desktop only */}
      <aside
        className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 border-r sticky top-12 self-start h-[calc(100vh-3rem)] overflow-y-auto"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="px-6 py-8 space-y-8">

          {/* Vault stats */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Vault</p>
            <div className="space-y-1.5">
              {[
                { label: "Concepts", value: stats.total_concepts },
                { label: "Hubs", value: stats.total_hubs },
                { label: "Sources", value: stats.total_sources },
                { label: "Collisions", value: stats.total_collisions },
                { label: "Sparks", value: stats.total_sparks },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-medium tabular-nums" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
            {(staleCount > 0 || essaySeeds.length > 0) && (
              <div className="mt-3 space-y-1">
                {staleCount > 0 && <p className="text-xs text-red-500">{staleCount} sparks stale</p>}
                {essaySeeds.length > 0 && <p className="text-xs text-indigo-400">{essaySeeds.length} essay seeds</p>}
              </div>
            )}
          </div>

          {/* Contents */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Contents</p>
            <div className="space-y-2">
              <a href="#collisions" className="block text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                Collision Queue <span style={{ color: "var(--text-dim)" }}>({collisions.length})</span>
              </a>
              <a href="#sparks" className="block text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                Spark Aging <span style={{ color: "var(--text-dim)" }}>({sparks.length})</span>
              </a>
            </div>
          </div>

          {/* Domains */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Domains</p>
            <div className="space-y-2.5">
              {domains.map(([domain, data]) => (
                <Link
                  key={domain}
                  href={`/domain/${domain}`}
                  className="flex items-center gap-2.5 group transition-opacity hover:opacity-70"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: data.color }} />
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--text-muted)" }}>
                    {DOMAIN_LABELS[domain] || domain}
                  </span>
                  <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-dim)" }}>{data.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Explore</p>
            <div className="space-y-2">
              {[
                { href: "/graph", label: "Full Graph" },
                { href: "/timeline", label: "Ingest Timeline" },
                { href: "/collisions", label: "All Collisions" },
                { href: "/sparks", label: "All Sparks" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{l.label}</span>
                  <span style={{ color: "var(--text-dim)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-5 sm:px-10 lg:px-16 py-10 sm:py-14">

        {/* Header */}
        <div className="mb-14 sm:mb-20">
          <h1
            className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            Writing Intelligence
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "var(--text-muted)" }}>
            {stats.total_concepts} concepts across {domains.length} domains —
            {" "}{stats.total_collisions} active tensions, {stats.total_sparks} sparks in motion.
          </p>

          {/* Mobile domain strip */}
          <div className="lg:hidden flex flex-wrap gap-2 mt-6">
            {domains.map(([domain, data]) => (
              <Link
                key={domain}
                href={`/domain/${domain}`}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-opacity hover:opacity-70"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: data.color }} />
                {DOMAIN_LABELS[domain]}
              </Link>
            ))}
          </div>
        </div>

        {/* Collision Queue */}
        <section id="collisions" className="mb-16 sm:mb-24">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
              Collision Queue
            </h2>
            <span className="text-sm" style={{ color: "var(--text-dim)" }}>
              {collisions.length} total · by pressure
            </span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {topCollisions.map((c) => <CollisionCard key={c.id} collision={c} />)}
          </div>
          {collisions.length > 8 && (
            <Link
              href="/collisions"
              className="mt-5 block text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Show all {collisions.length} collisions →
            </Link>
          )}
        </section>

        {/* Spark Aging */}
        <section id="sparks" className="mb-16 sm:mb-24">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
              Spark Aging
            </h2>
            <span className="text-sm" style={{ color: "var(--text-dim)" }}>
              {sparks.length} total · oldest first
            </span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {topSparks.map((s) => <SparkCard key={s.id} spark={s} />)}
          </div>
          {sparks.length > 10 && (
            <Link
              href="/sparks"
              className="mt-5 block text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Show all {sparks.length} sparks →
            </Link>
          )}
        </section>

      </main>
    </div>
  );
}
