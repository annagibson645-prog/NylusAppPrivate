import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

const DOMAIN_COLORS: Record<string, string> = {
  "eastern-spirituality": "#dc2626",
  "history":              "#e6c068",
  "cross-domain":         "#38bdf8",
  "psychology":           "#f59e0b",
  "behavioral-mechanics": "#a78bfa",
  "creative-practice":    "#14b8a6",
  "african-spirituality": "#34d399",
  "business":             "#e879a0",
};

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readMins(wc?: number) {
  return wc ? Math.max(1, Math.round(wc / 220)) : null;
}

function renderContent(raw: string): string {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");
  return marked.parse(body) as string;
}

export default async function ResearchSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let reports: any[] = [];
  try {
    reports = loadJSON<any[]>("research.json");
  } catch {
    notFound();
  }

  const report = reports.find((r) => r.id === slug);
  if (!report) notFound();

  const domainColor = DOMAIN_COLORS[report.domain] ?? "#8a849a";
  const html        = renderContent(report.content ?? "");
  const mins        = readMins(report.word_count);

  return (
    <>
      <Nav />
      <div className="void-page" style={{ "--domain-color": domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto" }} className="px-4 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-40">

        {/* ── Back ──────────────────────────────────────────────── */}
        <Link href="/research" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "#494456", textDecoration: "none", marginBottom: "48px",
          transition: "color 0.2s",
        }}>
          ← Research
        </Link>

        {/* ── Domain chip ───────────────────────────────────────── */}
        <div className="void-domain-chip">
          {report.domain !== "unknown" ? report.domain.replace(/-/g, " ") : "research"}
        </div>

        {/* ── Title ─────────────────────────────────────────────── */}
        <h1 className="void-title">{report.title}</h1>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "56px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", letterSpacing: "0.08em" }}>
          {report.created && <span>{formatDate(report.created)}</span>}
          {mins && <span>{mins} min read</span>}
          {report.word_count && <span>{report.word_count.toLocaleString()} words</span>}
          <span style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>{report.status}</span>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <article
          className="void-prose"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: "18px",
            lineHeight: 1.85,
            color: "#c8c0d8",
          }}
        />

      </div>
      </div>
    </>
  );
}
