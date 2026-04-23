import Link from "next/link";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface Props {
  spark: VaultNode;
}

const SUBTYPE_LABEL: Record<string, string> = {
  "essay-seed": "essay seed",
  resonance: "resonance",
  speculative: "speculative",
  contradiction: "contradiction",
  question: "question",
};

const SUBTYPE_COLOR: Record<string, string> = {
  "essay-seed": "#818cf8",
  resonance: "#f472b6",
  speculative: "#a78bfa",
  contradiction: "#fb923c",
  question: "#34d399",
};

export default function SparkCard({ spark: s }: Props) {
  const isStale = s.age_days > 30;
  const subtypeColor = SUBTYPE_COLOR[s.subtype || ""] || "#64748b";
  const subtypeLabel = SUBTYPE_LABEL[s.subtype || ""] || "spark";

  return (
    <div className="py-5 sm:py-6 border-b group" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start gap-4">
        <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: subtypeColor }} />

        <div className="flex-1 min-w-0">
          <Link
            href={`/spark/${s.id}`}
            className="text-base font-medium leading-snug hover:opacity-70 transition-opacity"
            style={{ color: "var(--text)" }}
          >
            {s.title}
          </Link>

          {s.live_wire && (
            <p className="mt-2 text-sm leading-relaxed line-clamp-2 italic" style={{ color: "var(--text-muted)" }}>
              {s.live_wire.slice(0, 200)}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs" style={{ color: subtypeColor }}>{subtypeLabel}</span>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              {DOMAIN_LABELS[s.domain] || s.domain}
            </span>
            <Link
              href={`/spark/${s.id}`}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-dim)" }}
            >
              Develop →
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mt-1">
          <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>{s.age_days}d</span>
          {isStale && <span className="text-[10px] text-red-500">stale</span>}
        </div>
      </div>
    </div>
  );
}
