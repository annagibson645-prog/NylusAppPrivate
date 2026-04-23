import CollisionCard from "@/components/CollisionCard";
import SparkCard from "@/components/SparkCard";
import DomainTemperature from "@/components/DomainTemperature";
import type { VaultNode, VaultStats } from "@/lib/types";
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "var(--text)" }}>
          Writing Intelligence
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {stats.total_concepts} concepts · {stats.total_hubs} hubs · {stats.total_sources} sources · {stats.total_collisions} collisions · {stats.total_sparks} sparks
          {staleCount > 0 && <span className="text-red-500 ml-3">· {staleCount} sparks stale</span>}
          {essaySeeds.length > 0 && <span className="text-indigo-500 ml-2">· {essaySeeds.length} essay seeds</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left: Collisions + Sparks */}
        <div className="lg:col-span-2 space-y-12">

          <section>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Collision Queue
              </h2>
              <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{collisions.length} total · by pressure</span>
            </div>
            <div className="border-t" style={{ borderColor: "var(--border)" }}>
              {topCollisions.map((c) => <CollisionCard key={c.id} collision={c} />)}
            </div>
            {collisions.length > 8 && (
              <Link href="/collisions" className="mt-3 block text-xs hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
                Show all {collisions.length} →
              </Link>
            )}
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Spark Aging
              </h2>
              <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{sparks.length} total · oldest first</span>
            </div>
            <div className="border-t" style={{ borderColor: "var(--border)" }}>
              {topSparks.map((s) => <SparkCard key={s.id} spark={s} />)}
            </div>
            {sparks.length > 10 && (
              <Link href="/sparks" className="mt-3 block text-xs hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
                Show all {sparks.length} →
              </Link>
            )}
          </section>
        </div>

        {/* Right: Domain pressure + Quick access */}
        <div className="space-y-10">
          <DomainTemperature stats={stats} />

          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              Quick Access
            </h3>
            <div className="space-y-2.5">
              {[
                { href: "/graph", label: "Full Graph" },
                { href: "/timeline", label: "Ingest Timeline" },
                { href: "/collisions", label: "All Collisions" },
                { href: "/sparks", label: "All Sparks" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-sm hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{l.label}</span>
                  <span style={{ color: "var(--text-dim)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
