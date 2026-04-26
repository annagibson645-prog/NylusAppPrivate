"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { VaultNode } from "@/lib/types";

function formatDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(wordCount?: number) {
  if (!wordCount) return null;
  return `${Math.max(1, Math.round(wordCount / 220))} min read`;
}

export default function ResearchList({ reports }: { reports: VaultNode[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.excerpt?.toLowerCase().includes(q) ||
        r.domain?.toLowerCase().includes(q)
    );
  }, [query, reports]);

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Dashboard
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Research</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: "var(--text)" }}>
          Research
        </h1>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          {reports.length > 0
            ? `${reports.length} ${reports.length === 1 ? "report" : "reports"}`
            : "Deep research reports generated via VRC"}
        </p>
      </div>

      {/* Search bar */}
      {reports.length > 0 && (
        <div className="relative mb-10">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ color: "var(--text-dim)" }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${reports.length} reports…`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs hover:opacity-70"
              style={{ color: "var(--text-dim)" }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {reports.length === 0 ? (
        <div
          className="rounded-xl border border-dashed px-8 py-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-sm mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
            No research reports yet
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Run a VRC session and save the output to{" "}
            <code
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              The Platform/Research
            </code>{" "}
            in your vault
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: "var(--text-dim)" }}>
          No reports match "{query}"
        </p>
      ) : (
        <>
          {query && (
            <p className="text-xs mb-6" style={{ color: "var(--text-dim)" }}>
              {filtered.length} {filtered.length === 1 ? "result" : "results"} for "{query}"
            </p>
          )}
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {filtered.map((report) => (
              <Link
                key={report.id}
                href={`/research/${report.id}`}
                className="group block py-8 border-b hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-lg font-semibold leading-snug mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      {report.title}
                    </h2>
                    {report.excerpt && (
                      <p
                        className="text-sm leading-relaxed line-clamp-2 mb-4"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {report.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-dim)" }}>
                      {report.created && <span>{formatDate(report.created)}</span>}
                      {report.word_count && (
                        <span>{report.word_count.toLocaleString()} words · {readTime(report.word_count)}</span>
                      )}
                      {report.domain && report.domain !== "unknown" && (
                        <span
                          className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                        >
                          {report.domain}
                        </span>
                      )}
                      {report.status && report.status !== "unknown" && (
                        <span
                          className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                        >
                          {report.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm mt-1" style={{ color: "var(--text-dim)" }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
