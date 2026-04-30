import { readFileSync } from "fs";
import path from "path";
import Link from "next/link";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function formatDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(wordCount?: number) {
  if (!wordCount) return null;
  const mins = Math.max(1, Math.round(wordCount / 220));
  return `${mins} min read`;
}

export default function EssaysPage() {
  // Merge essays + research so the route is never empty.
  // essays.json = type:essay files from The Platform/Essays/
  // research.json = type:research files from The Platform/Research/
  // Both are long-form published writing; show them together.
  let essays: VaultNode[] = [];
  let research: VaultNode[] = [];
  try { essays = loadJSON<VaultNode[]>("essays.json"); } catch { essays = []; }
  try { research = loadJSON<VaultNode[]>("research.json"); } catch { research = []; }

  const all = [...essays, ...research].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Dashboard
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Essays</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: "var(--text)" }}>
          Essays
        </h1>
        {all.length > 0 && (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            {all.length} {all.length === 1 ? "piece" : "pieces"}
          </p>
        )}
      </div>

      {all.length === 0 ? (
        <div
          className="rounded-xl border border-dashed px-8 py-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-sm mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
            No essays yet
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Add a markdown file to <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>The Platform/Essays</code> in your vault
          </p>
        </div>
      ) : (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {all.map((essay) => (
            <Link
              key={essay.id}
              href={essay.type === "research" ? `/research/${essay.id}` : `/essay/${essay.id}`}
              className="group block py-8 border-b hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold leading-snug mb-2 group-hover:opacity-80 transition-opacity" style={{ color: "var(--text)" }}>
                    {essay.title}
                  </h2>
                  {essay.excerpt && (
                    <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--text-muted)" }}>
                      {essay.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-dim)" }}>
                    {essay.created && (
                      <span>{formatDate(essay.created)}</span>
                    )}
                    {essay.word_count && (
                      <span>{essay.word_count.toLocaleString()} words · {readTime(essay.word_count)}</span>
                    )}
                    {essay.status && essay.status !== "unknown" && (
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                        {essay.status}
                      </span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-sm mt-1" style={{ color: "var(--text-dim)" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
