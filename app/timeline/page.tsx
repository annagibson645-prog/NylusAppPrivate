import { readFileSync } from "fs";
import path from "path";
import type { TimelineEntry } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

const ACTION_COLORS: Record<string, string> = {
  ingest: "#3b82f6",
  "batch-ingest": "#6366f1",
  "source-update": "#f59e0b",
  contradiction: "#ef4444",
  collision: "#a78bfa",
  "hub-created": "#14b8a6",
  lint: "#64748b",
  "question-resolved": "#22c55e",
  promoted: "#f472b6",
  "spark-processed": "#fb923c",
};

function groupByMonth(entries: TimelineEntry[]) {
  const groups = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month)!.push(e);
  }
  return groups;
}

export default function TimelinePage() {
  const entries = loadJSON<TimelineEntry[]>("timeline.json");
  const grouped = groupByMonth(entries);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Ingest Timeline</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{entries.length} log entries</p>

      {Array.from(grouped.entries()).map(([month, monthEntries]) => (
        <section key={month} className="mb-8">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4 sticky top-12 py-2"
            style={{ background: "var(--bg)", color: "var(--text-muted)" }}
          >
            {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            <span className="ml-2 normal-case font-normal" style={{ color: "var(--text-dim)" }}>
              {monthEntries.length} events
            </span>
          </h2>

          <div className="relative">
            <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ background: "var(--border)" }} />
            <div className="space-y-3">
              {monthEntries.map((e, i) => {
                const color = ACTION_COLORS[e.action] || "#475569";
                return (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 pl-6 sm:pl-8 relative">
                    <div
                      className="absolute left-0 top-1.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: color + "22", border: `1px solid ${color}44` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    </div>
                    <div className="flex-1 min-w-0 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono" style={{ color }}>{e.action}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{e.date}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{e.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
