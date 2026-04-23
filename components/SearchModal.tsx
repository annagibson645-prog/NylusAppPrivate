"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchItem } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchItem[]>([]);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);

  // Load index once
  useEffect(() => {
    fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((data: SearchItem[]) => {
        setIndex(data);
        fuseRef.current = new Fuse(data, {
          keys: ["title", "excerpt", "domain", "type"],
          threshold: 0.35,
          includeScore: true,
        });
      });
  }, []);

  // Global Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          // trigger open from parent — parent handles this
        }
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search
  useEffect(() => {
    if (!fuseRef.current) return;
    if (!query.trim()) {
      // Show recent/top items when empty
      setResults(index.slice(0, 12));
      return;
    }
    const hits = fuseRef.current.search(query).slice(0, 20).map((r) => r.item);
    setResults(hits);
    setSelected(0);
  }, [query, index]);

  const navigate = (item: SearchItem) => {
    const path = item.type === "concept" || item.type === "hub"
      ? `/concept/${item.id}`
      : item.type === "spark"
      ? `/spark/${item.id}`
      : item.type === "collision"
      ? `/collision/${item.id}`
      : item.type === "source"
      ? `/source/${item.id}`
      : `/concept/${item.id}`;
    router.push(path);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-0"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border overflow-hidden shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-slate-500">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search concepts, sparks, collisions..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
          />
          <kbd className="text-[10px] text-slate-600 font-mono border px-1.5 py-0.5 rounded" style={{ borderColor: "var(--border)" }}>esc</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.map((item, i) => (
            <button
              key={item.id}
              onClick={() => navigate(item)}
              className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                i === selected ? "bg-white/8" : "hover:bg-white/4"
              }`}
            >
              <span
                className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{item.title}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{item.excerpt}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)" }}>
                  {DOMAIN_LABELS[item.domain] || item.domain}
                </span>
                <span className="text-[10px] text-slate-600">{item.type}</span>
              </div>
            </button>
          ))}
          {results.length === 0 && query && (
            <div className="px-4 py-6 text-center text-sm text-slate-600">No results for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
