import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import type { VaultNode } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = 'force-dynamic';

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

function renderEssay(raw: string): string {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");
  return marked.parse(body) as string;
}


export default async function EssayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let essays: VaultNode[] = [];
  try {
    essays = loadJSON<VaultNode[]>("essays.json");
  } catch {
    notFound();
  }

  const essay = essays.find((e) => e.id === slug);
  if (!essay) notFound();

  const html = renderEssay(essay.content);

  return (
    <div className="flex justify-center">
      <div className="w-full px-6 sm:px-12 md:px-16 py-12 sm:py-20" style={{ maxWidth: "52rem" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 text-sm">
          <Link href="/essays" className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Essays
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="truncate" style={{ color: "var(--text-dim)" }}>{essay.title}</span>
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />
            <a
              href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(essay.path)}`}
              className="text-sm hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-dim)" }}
            >
              Open in Obsidian ↗
            </a>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5" style={{ color: "var(--text)" }}>
            {essay.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-dim)" }}>
            {essay.created && <span>{formatDate(essay.created)}</span>}
            {essay.word_count && (
              <>
                <span>·</span>
                <span>{essay.word_count.toLocaleString()} words</span>
                <span>·</span>
                <span>{readTime(essay.word_count)}</span>
              </>
            )}
            {essay.status && essay.status !== "unknown" && (
              <>
                <span>·</span>
                <span
                  className="capitalize text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {essay.status}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-12 h-px" style={{ background: "var(--border)" }} />

        {/* Prose */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {/* Footer nav */}
        <div className="mt-20 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/essays"
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            ← All essays
          </Link>
        </div>
      </div>
    </div>
  );
}
