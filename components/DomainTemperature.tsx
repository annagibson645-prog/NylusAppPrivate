"use client";
import { useRouter } from "next/navigation";
import type { VaultStats } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface Props {
  stats: VaultStats;
}

export default function DomainTemperature({ stats }: Props) {
  const router = useRouter();
  const domains = Object.entries(stats.domains).filter(([d]) => d !== "unknown");
  const maxPressure = Math.max(...domains.map(([, d]) => d.collisions + d.sparks));

  return (
    <div>
      <h3 className="text-[11px] font-medium text-slate-600 uppercase tracking-widest mb-4">
        Domain Pressure
      </h3>
      <div className="space-y-3">
        {domains
          .sort(([, a], [, b]) => (b.collisions + b.sparks) - (a.collisions + a.sparks))
          .map(([domain, data]) => {
            const pressure = data.collisions + data.sparks;
            const pct = maxPressure > 0 ? (pressure / maxPressure) * 100 : 0;
            return (
              <button
                key={domain}
                onClick={() => router.push(`/domain/${domain}`)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                    {DOMAIN_LABELS[domain] || domain}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span>{data.count}</span>
                    <span style={{ color: data.color }}>{data.collisions} ⇄</span>
                    <span className="text-pink-600">{data.sparks} ✦</span>
                  </div>
                </div>
                <div className="h-px rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: data.color, opacity: 0.7 }}
                  />
                </div>
              </button>
            );
          })}
      </div>
      <div className="mt-4 pt-3 border-t text-[10px] text-slate-700 flex gap-4" style={{ borderColor: "var(--border)" }}>
        <span>⇄ collisions</span>
        <span className="text-pink-800">✦ sparks</span>
      </div>
    </div>
  );
}
