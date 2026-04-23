import { readFileSync } from "fs";
import path from "path";
import CollisionsView from "@/components/CollisionsView";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function CollisionsPage() {
  const collisions = loadJSON<VaultNode[]>("collisions.json");
  return <CollisionsView collisions={collisions} />;
}
