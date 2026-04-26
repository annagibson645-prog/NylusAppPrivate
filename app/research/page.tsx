import { readFileSync } from "fs";
import path from "path";
import type { VaultNode } from "@/lib/types";
import ResearchList from "@/components/ResearchList";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

export default function ResearchPage() {
  let reports: VaultNode[] = [];
  try {
    reports = loadJSON<VaultNode[]>("research.json");
  } catch {
    reports = [];
  }

  return <ResearchList reports={reports} />;
}
