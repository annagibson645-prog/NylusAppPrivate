import { readFileSync } from "fs";
import path from "path";
import SparkCard from "@/components/SparkCard";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function SparksPage() {
  const sparks = loadJSON<VaultNode[]>("sparks.json");
  const stale = sparks.filter((s) => s.age_days > 30);
  const essaySeeds = sparks.filter((s) => s.subtype === "essay-seed");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-1">All Sparks</h1>
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
        <span>{sparks.length} total</span>
        {stale.length > 0 && <span className="text-red-400">{stale.length} stale (&gt;30d)</span>}
        <span className="text-indigo-400">{essaySeeds.length} essay seeds</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sparks.map((s) => <SparkCard key={s.id} spark={s} />)}
      </div>
    </div>
  );
}
