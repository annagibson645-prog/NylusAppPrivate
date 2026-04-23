import { readFileSync } from "fs";
import path from "path";
import SparksView from "@/components/SparksView";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function SparksPage() {
  const sparks = loadJSON<VaultNode[]>("sparks.json");
  return <SparksView sparks={sparks} />;
}
