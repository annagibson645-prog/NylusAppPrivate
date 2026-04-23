import { readFileSync } from "fs";
import path from "path";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";
import { DOMAIN_LABELS, STATUS_COLORS } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function SectionHeader({ title, count, description }: { title: string; count: number; description: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
        <span className="text-sm tabular-nums" style={{ color: "var(--text-dim)" }}>{count}</span>
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{description}</p>
    </div>
  );
}

export default function WorkshopPage() {
  const sparks = loadJSON<VaultNode[]>("sparks.json");
  const collisions = loadJSON<VaultNode[]>("collisions.json");
  const graph = loadJSON<GraphData>("graph.json");

  const essaySeeds = sparks
    .filter((s) => s.subtype === "essay-seed")
    .sort((a, b) => b.age_days - a.age_days);

  const staleSparks = sparks
    .filter((s) => s.age_days > 30 && s.subtype !== "essay-seed")
    .sort((a, b) => b.age_days - a.age_days);

  const stubConcepts = graph.nodes
    .filter((n) => n.type === "concept" && n.status === "stub")
    .sort((a, b) => a.sources - b.sources)
    .slice(0, 20);

  const hotCollisions = collisions
    .filter((c) => (c.pressure_score ?? 0) > 0)
    .sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0))
    .slice(0, 8);

  const totalItems = essaySeeds.length + staleSparks.length + stubConcepts.length + hotCollisions.length;

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="mb-14">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4" style={{ color: "var(--text)" }}>
          Workshop
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {totalItems} items need attention — essay seeds ready to write, sparks going stale, concepts waiting for sources.
        </p>
      </div>

      {/* Essay Seeds */}
      {essaySeeds.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            title="Essay Seeds"
            count={essaySeeds.length}
            description="Sparks tagged as essay seeds — ideas developed enough to become writing."
          />
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {essaySeeds.map((s) => (
              <Link
                key={s.id}
                href={`/spark/${s.id}`}
                className="flex items-start gap-4 py-5 border-b hover:opacity-70 transition-opacity group"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0 bg-indigo-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium leading-snug mb-1.5" style={{ color: "var(--text)" }}>
                    {s.title}
                  </div>
                  {s.live_wire && (
                    <p className="text-sm leading-relaxed line-clamp-2 italic" style={{ color: "var(--text-muted)" }}>
                      {s.live_wire.slice(0, 200)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {DOMAIN_LABELS[s.domain] || s.domain}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>{s.age_days}d old</span>
                  </div>
                </div>
                <span className="text-xs flex-shrink-0 mt-1 text-indigo-400">Write →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stale Sparks */}
      {staleSparks.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            title="Stale Sparks"
            count={staleSparks.length}
            description="Sparks older than 30 days — develop them, promote them, or prune them."
          />
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {staleSparks.slice(0, 15).map((s) => (
              <Link
                key={s.id}
                href={`/spark/${s.id}`}
                className="flex items-start gap-4 py-4 border-b hover:opacity-70 transition-opacity"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0 bg-red-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                    {s.title}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {DOMAIN_LABELS[s.domain] || s.domain}
                    </span>
                    <span className="text-xs text-red-400">{s.age_days}d old</span>
                  </div>
                </div>
              </Link>
            ))}
            {staleSparks.length > 15 && (
              <p className="pt-4 text-sm" style={{ color: "var(--text-dim)" }}>
                +{staleSparks.length - 15} more stale sparks
              </p>
            )}
          </div>
        </section>
      )}

      {/* High-pressure Collisions */}
      {hotCollisions.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            title="Hot Collisions"
            count={hotCollisions.length}
            description="Highest-pressure tensions in the vault — the ones most ready to write through."
          />
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {hotCollisions.map((c) => (
              <Link
                key={c.id}
                href={`/collision/${c.id}`}
                className="flex items-start gap-4 py-5 border-b hover:opacity-70 transition-opacity"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium leading-snug mb-1.5" style={{ color: "var(--text)" }}>
                    {c.title}
                  </div>
                  {c.tension_a && c.tension_b && (
                    <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                      <span className="truncate">{c.tension_a}</span>
                      <span className="flex-shrink-0">·</span>
                      <span className="truncate">{c.tension_b}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs" style={{ color: c.color }}>
                      {DOMAIN_LABELS[c.domain] || c.domain}
                    </span>
                    {c.pressure_score && (
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                        pressure {c.pressure_score}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs flex-shrink-0 mt-1" style={{ color: "var(--text-dim)" }}>Open →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stub Concepts */}
      {stubConcepts.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            title="Stub Concepts"
            count={stubConcepts.length}
            description="Concepts with no sources yet — placeholders waiting to be developed."
          />
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {stubConcepts.map((n) => (
              <Link
                key={n.id}
                href={`/concept/${n.id}`}
                className="flex items-start gap-4 py-4 border-b hover:opacity-70 transition-opacity"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS["stub"] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                    {n.title}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {DOMAIN_LABELS[n.domain] || n.domain}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {n.sources} {n.sources === 1 ? "source" : "sources"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
