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

  const domains = Object.entries(stats.domains).filter(([d]) => d !== "unknown");

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl">

      {/* Header */}
      <div className="mb-14 sm:mb-20">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4" style={{ color: "var(--text)" }}>
          Writing Intelligence
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {stats.total_concepts} concepts across {domains.length} domains —{" "}
          {stats.total_collisions} active tensions, {stats.total_sparks} sparks in motion.
          {staleCount > 0 && <span className="text-red-500 ml-2">{staleCount} stale.</span>}
          {essaySeeds.length > 0 && <span className="text-indigo-400 ml-2">{essaySeeds.length} essay seeds ready.</span>}
        </p>

        {/* Mobile domain pills */}
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
            {collisions.length} total
          </span>
        </div>
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {topCollisions.map((c) => <CollisionCard key={c.id} collision={c} />)}
        </div>
        {collisions.length > 8 && (
          <Link href="/collisions" className="mt-5 block text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
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
            {sparks.length} total
          </span>
        </div>
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {topSparks.map((s) => <SparkCard key={s.id} spark={s} />)}
        </div>
        {sparks.length > 10 && (
          <Link href="/sparks" className="mt-5 block text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            Show all {sparks.length} sparks →
          </Link>
        )}
      </section>

    </div>
  );
}
