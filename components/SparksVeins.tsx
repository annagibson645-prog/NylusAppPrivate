"use client";
import Link from "next/link";
import { useState } from "react";

type Spark = { id: string; title: string };
type Domain = { key: string; label: string; color: string; count: number; sparks: Spark[] };

const INITIAL = 8;

export default function SparksVeins({ domains }: { domains: Domain[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <>
      <div className="veins-wrap">
        <div className="veins-hd">
          <h1>Veins of Thought</h1>
          <p>eight currents · open one to follow it</p>
        </div>
        {domains.map((d, i) => {
          const isOpen = open === d.key;
          const showAll = !!expanded[d.key];
          const list = showAll ? d.sparks : d.sparks.slice(0, INITIAL);
          const hasMore = d.sparks.length > INITIAL;
          const dur = (4 + i * 0.6).toFixed(1) + "s";
          return (
            <div key={d.key} className={"vrow" + (isOpen ? " open" : "")} style={{ ["--c" as string]: d.color } as React.CSSProperties}>
              <button className="vhead" onClick={() => setOpen(isOpen ? null : d.key)} aria-expanded={isOpen}>
                <span className="vname">{d.label}</span>
                <span className="vein"><i style={{ ["--d" as string]: dur } as React.CSSProperties} /><i className="b" style={{ ["--d" as string]: dur } as React.CSSProperties} /></span>
                <span className="vct">{d.count}</span>
                <span className="vchev">›</span>
              </button>
              {isOpen && (
                <div className="vbody">
                  <div className="vinner">
                    {list.map((s, j) => (
                      <Link key={s.id} href={`/spark/${s.id}`} className="vitem">
                        <span className="n">{String(j + 1).padStart(2, "0")}</span>
                        <span className="t">{s.title}</span>
                      </Link>
                    ))}
                    {!showAll && hasMore && (
                      <button
                        className="vmore"
                        onClick={(e) => { e.stopPropagation(); setExpanded((x) => ({ ...x, [d.key]: true })); }}
                      >
                        <span className="plus">+</span> show all {d.count} sparks
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
