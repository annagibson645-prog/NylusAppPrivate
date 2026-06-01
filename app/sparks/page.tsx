import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import SparksVeins from "@/components/SparksVeins";

export const dynamic = "force-dynamic";

// 8 domains (excludes "unknown"), in display order, with their colors.
const DOMAIN_META: { key: string; label: string; color: string }[] = [
  { key: "cross-domain",         label: "Cross-Domain",          color: "#38bdf8" },
  { key: "eastern-spirituality", label: "Eastern Spirituality",  color: "#dc2626" },
  { key: "psychology",           label: "Psychology",            color: "#f59e0b" },
  { key: "creative-practice",    label: "Creative Practice",     color: "#14b8a6" },
  { key: "history",              label: "History",               color: "#e6c068" },
  { key: "behavioral-mechanics", label: "Behavioral Mechanics",  color: "#a78bfa" },
  { key: "african-spirituality", label: "African Spirituality",  color: "#34d399" },
  { key: "business",             label: "Business",              color: "#e879a0" },
];

interface SparkNode { id: string; title?: string; text?: string; domain: string; type?: string; }

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SparksPage() {
  const raw = loadJSON<SparkNode[]>("sparks.json");

  const domains = DOMAIN_META.map((m) => {
    const sparks = raw
      .filter((s) => s.domain === m.key)
      .map((s) => ({ id: s.id, title: cleanTitle(s.title || s.text || "Untitled") }));
    return { ...m, count: sparks.length, sparks };
  }).filter((d) => d.count > 0);

  return (
    <>
      <NavG active="Sparks" />
      <SparksVeins domains={domains} />
    </>
  );
}
