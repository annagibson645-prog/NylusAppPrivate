import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import type { VaultNode } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function formatDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(wordCount?: number) {
  if (!wordCount) return null;
  return `${Math.max(1, Math.round(wordCount / 220))} min read`;
}

function renderReport(raw: string): string {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");
  return marked.parse(body) as string;
}

export async function generateStaticParams() {
  try {
    const reports = loadJSON<VaultNode[]>("research.json");
    return reports.map((r) => ({ slug: r.id }));
  } catch {
    return [];
  }
}

export default async function ResearchReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let reports: VaultNode[] = [];
  try {
    reports = loadJSON<VaultNode[]>("research.json");
  } catch {
    notFound();
  }

  const report = reports.find((r) => r.id === slug);
  if (!report) notFound();

  const html = renderReport(report.content);

  return (
    <div className="flex justify-center">
      <div className="w-full px-6 sm:px-12 md:px-16 py-12 sm:py-20" style={{ maxWidth: "52rem" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 text-sm flex-wrap">
          <Link href="/research" className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Research
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="truncate" style={{ color: "var(--text-dim)" }}>{report.title}</span>
          <a
            href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(report.path)}`}
            className="ml-auto text-sm hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: "var(--text-dim)" }}
          >
            Open in Obsidian ↗
          </a>
        </div>

        {/* Title block */}
        <div className="mb-12">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5"
            style={{ color: "var(--text)" }}
          >
            {report.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-dim)" }}>
            {report.created && <span>{formatDate(report.created)}</span>}
            {report.word_count && (
              <>
                <span>·</span>
                <span>{report.word_count.toLocaleString()} words</span>
                <span>·</span>
                <span>{readTime(report.word_count)}</span>
              </>
            )}
            {report.domain && report.domain !== "unknown" && (
              <>
                <span>·</span>
                <span
                  className="capitalize text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {report.domain}
                </span>
              </>
            )}
            {report.status && report.status !== "unknown" && (
              <>
                <span>·</span>
                <span
                  className="capitalize text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {report.status}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-12 h-px" style={{ background: "var(--border)" }} />

        {/* Rendered markdown */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {/* Footer */}
        <div className="mt-20 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/research"
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            ← All research
          </Link>
        </div>
      </div>
    </div>
  );
}
