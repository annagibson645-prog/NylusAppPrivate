import Link from "next/link";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface Props {
  collision: VaultNode;
}

function ageColor(days: number) {
  if (days < 7) return "#34d399";
  if (days < 21) return "#f59e0b";
  return "#f87171";
}

export default function CollisionCard({ collision: c }: Props) {
  return (
    <div className="py-5 sm:py-6 border-b group" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start gap-4">
        <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />

        <div className="flex-1 min-w-0">
          <Link
            href={`/collision/${c.id}`}
            className="text-base font-medium leading-snug hover:opacity-70 transition-opacity"
            style={{ color: "var(--text)" }}
          >
            {c.title}
          </Link>

          {c.tension_a && c.tension_b && (
            <div className="flex items-center gap-2 mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="truncate">{c.tension_a}</span>
              <span className="flex-shrink-0">·</span>
              <span className="truncate">{c.tension_b}</span>
            </div>
          )}

          {c.candidate_idea && (
            <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
              {c.candidate_idea}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs" style={{ color: c.color }}>
              {DOMAIN_LABELS[c.domain] || c.domain}
            </span>
            <Link
              href={`/collision/${c.id}`}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-dim)" }}
            >
              Open brief →
            </Link>
          </div>
        </div>

        <span className="text-xs font-mono flex-shrink-0 mt-1" style={{ color: ageColor(c.age_days) }}>
          {c.age_days}d
        </span>
      </div>
    </div>
  );
}
