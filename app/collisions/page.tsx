import { readFileSync } from "fs";
import path from "path";
import CollisionCard from "@/components/CollisionCard";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function CollisionsPage() {
  const collisions = loadJSON<VaultNode[]>("collisions.json");
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-1">All Collisions</h1>
      <p className="text-sm text-slate-500 mb-6">{collisions.length} · sorted by pressure score (age × source depth)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {collisions.map((c) => <CollisionCard key={c.id} collision={c} />)}
      </div>
    </div>
  );
}
