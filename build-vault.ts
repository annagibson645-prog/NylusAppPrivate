import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────
const VAULT_PATH = path.resolve(__dirname, "../NylusS");
const OUT_DIR = path.resolve(__dirname, "public/data");

const INCLUDED_DIRS = [
  "ARCHIVES/concepts",
  "ARCHIVES/sources",
  "LAB/Collisions",
  "LAB/Sparks",
  "LAB/Threads",
  "ARCHIVES/logs",
  "The Platform/Essays",
];

const DOMAIN_COLORS: Record<string, string> = {
  history: "#f59e0b",
  "eastern-spirituality": "#8b5cf6",
  psychology: "#3b82f6",
  "behavioral-mechanics": "#f97316",
  "cross-domain": "#14b8a6",
  "creative-practice": "#f43f5e",
  "african-spirituality": "#10b981",
  "ai-collaboration": "#64748b",
  unknown: "#6b7280",
};

// ── Types ────────────────────────────────────────────────────────────────────
interface VaultNode {
  id: string;
  title: string;
  type: string;
  subtype?: string;
  domain: string;
  status: string;
  created: string;
  updated: string;
  sources: number;
  path: string;
  content: string;
  excerpt: string;
  links: string[];
  backlinks: string[];
  hub: string | null;
  age_days: number;
  color: string;
  classification?: string;
  live_wire?: string;
  candidate_idea?: string;
  tension_a?: string;
  tension_b?: string;
  pressure_score?: number;
  word_count?: number;
}

interface VaultEdge {
  source: string;
  target: string;
}

interface CollisionNode extends VaultNode {
  pressure_score: number;
}

interface SparkNode extends VaultNode {
  live_wire: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(filePath: string): string {
  return path
    .basename(filePath, ".md")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractWikilinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]|#]+?)(?:\|[^\]]+)?\]\]/g);
  const links: string[] = [];
  for (const m of matches) {
    const raw = m[1].trim();
    links.push(slugify(raw));
  }
  return [...new Set(links)];
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(
    `##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
    "i"
  );
  const match = content.match(regex);
  return match ? match[1].trim().slice(0, 400) : "";
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, _p, alias) => alias || _p)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[.*?\]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function generateExcerpt(content: string, title: string): string {
  const lines = content.split("\n");
  const paragraphs: string[] = [];
  let current = "";

  for (const line of lines) {
    const t = line.trim();

    // Skip headings, rules, empty lines, tags
    if (!t || /^#{1,6}\s/.test(t) || /^[-=*]{3,}$/.test(t) || /^#\w/.test(t)) {
      if (current.length > 60) paragraphs.push(current.trim());
      current = "";
      continue;
    }
    // Skip metadata-style lines: "Key: value" or "**Key**:" patterns
    if (/^(\*{0,2})[A-Z][a-zA-Z\s]{2,20}\1:\s/.test(t)) continue;
    // Skip lines that are mostly uppercase (section labels, not prose)
    if (t.length < 80 && t.replace(/[^A-Z]/g, "").length / t.length > 0.6) continue;
    // Skip footnote definitions
    if (/^\[\^.+\]:/.test(t)) continue;
    // Skip lines that just repeat the title
    if (t.toLowerCase().includes(title.toLowerCase().slice(0, 20))) continue;

    current += (current ? " " : "") + t;
  }
  if (current.length > 60) paragraphs.push(current.trim());

  const best = paragraphs[0] || lines.find((l) => l.trim().length > 60) || "";
  return stripMarkdown(best).replace(/\s+/g, " ").trim().slice(0, 200);
}

function getTitle(content: string, filePath: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return path
    .basename(filePath, ".md")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function walkDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

// ── Parse log files for timeline ────────────────────────────────────────────
function parseLogFiles(): object[] {
  const logsDir = path.join(VAULT_PATH, "ARCHIVES/logs");
  if (!fs.existsSync(logsDir)) return [];

  const entries: object[] = [];
  const files = fs.readdirSync(logsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(logsDir, file), "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const m = line.match(
        /^##\s+\[?(\d{4}-\d{2}-\d{2})\]?\s+(\w[\w-]*)\s*\|\s*(.+)/
      );
      if (m) {
        entries.push({
          date: m[1],
          action: m[2],
          description: m[3].trim(),
        });
      }
    }
  }

  // Also check ARCHIVES/log.md (historical log)
  const singleLog = path.join(VAULT_PATH, "ARCHIVES/log.md");
  if (fs.existsSync(singleLog)) {
    const content = fs.readFileSync(singleLog, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(
        /^##\s+\[?(\d{4}-\d{2}-\d{2})\]?\s+(\w[\w-]*)\s*\|\s*(.+)/
      );
      if (m) {
        entries.push({ date: m[1], action: m[2], description: m[3].trim() });
      }
    }
  }

  return entries.sort((a: any, b: any) =>
    b.date.localeCompare(a.date)
  );
}

// ── Main build ───────────────────────────────────────────────────────────────
async function buildVault() {
  console.log("🔍 Scanning vault at:", VAULT_PATH);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Collect all markdown files from included dirs
  const allFiles: string[] = [];
  for (const dir of INCLUDED_DIRS) {
    allFiles.push(...walkDir(path.join(VAULT_PATH, dir)));
  }

  console.log(`📄 Found ${allFiles.length} markdown files`);

  const nodes: Map<string, VaultNode> = new Map();
  const slugToPath: Map<string, string> = new Map();

  // First pass: parse frontmatter + metadata
  for (const filePath of allFiles) {
    const raw = fs.readFileSync(filePath, "utf-8").replace(/\0/g, ""); // strip null bytes
    let fm: Record<string, any> = {};
    let content = raw;
    try {
      const parsed = matter(raw);
      fm = parsed.data;
      content = parsed.content;
    } catch {
      // malformed frontmatter — treat as plain content
    }

    const slug = slugify(filePath);
    const relPath = path.relative(VAULT_PATH, filePath).replace(/\\/g, "/");
    const title = getTitle(content, filePath);
    const ALLOWED_DOMAINS = new Set([
      "history", "eastern-spirituality", "african-spirituality",
      "psychology", "behavioral-mechanics", "cross-domain",
      "creative-practice", "ai-collaboration", "unknown",
    ]);
    const rawDomain = fm.domain || inferDomain(relPath);
    const domain = ALLOWED_DOMAINS.has(rawDomain) ? rawDomain : "unknown";
    const type = fm.type || inferType(relPath);
    const created = fm.created ? String(fm.created) : "";
    const age = daysSince(created);

    const node: VaultNode = {
      id: slug,
      title,
      type,
      subtype: fm.subtype,
      domain,
      status: fm.status || "stub",
      created,
      updated: fm.updated ? String(fm.updated) : created,
      sources: Number(fm.sources) || 0,
      path: relPath,
      content: raw,
      excerpt: generateExcerpt(content, title),
      links: extractWikilinks(content),
      backlinks: [],
      hub: null,
      age_days: age,
      color: DOMAIN_COLORS[domain] || DOMAIN_COLORS.unknown,
      classification: fm.classification,
    };

    // Collision-specific fields
    if (type === "collision") {
      node.candidate_idea = extractSection(content, "Candidate Idea");
      node.tension_a = "";
      node.tension_b = "";
      const tensions = extractSection(content, "Source Tensions");
      const parts = tensions.split(" vs ");
      if (parts.length >= 2) {
        node.tension_a = parts[0].replace(/^-\s*/, "").trim().slice(0, 80);
        node.tension_b = parts[1].trim().slice(0, 80);
      }
      node.pressure_score = age * Math.max(node.sources, 1);
    }

    // Spark-specific fields
    if (type === "spark") {
      node.live_wire = extractSection(content, "The Live Wire");
    }
    if (type === "essay") {
      const bodyText = content.replace(/^---[\s\S]*?---\n?/, "").replace(/[#*`\[\]]/g, "");
      node.word_count = bodyText.trim().split(/\s+/).filter(Boolean).length;
    }

    nodes.set(slug, node);
    slugToPath.set(slug, relPath);
  }

  // Second pass: resolve backlinks
  for (const node of nodes.values()) {
    for (const linkedSlug of node.links) {
      const target = nodes.get(linkedSlug);
      if (target && !target.backlinks.includes(node.id)) {
        target.backlinks.push(node.id);
      }
    }
  }

  // Third pass: resolve hub membership from hubs folder
  const hubsDir = path.join(VAULT_PATH, "ARCHIVES/concepts/hubs");
  if (fs.existsSync(hubsDir)) {
    for (const hubFile of walkDir(hubsDir)) {
      const hubSlug = slugify(hubFile);
      const { content: hubContent } = matter(
        fs.readFileSync(hubFile, "utf-8")
      );
      const linkedSlugs = extractWikilinks(hubContent);
      for (const ls of linkedSlugs) {
        const target = nodes.get(ls);
        if (target && target.type === "concept") {
          target.hub = hubSlug;
        }
      }
    }
  }

  // Build edges
  const edges: VaultEdge[] = [];
  const edgeSet = new Set<string>();
  for (const node of nodes.values()) {
    for (const linkedSlug of node.links) {
      if (nodes.has(linkedSlug)) {
        const key = [node.id, linkedSlug].sort().join("--");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: node.id, target: linkedSlug });
        }
      }
    }
  }

  const nodeArray = Array.from(nodes.values());

  // ── Write outputs ──────────────────────────────────────────────────────────

  // graph.json
  fs.writeFileSync(
    path.join(OUT_DIR, "graph.json"),
    JSON.stringify({ nodes: nodeArray, edges }, null, 0)
  );

  // collisions.json — sorted by pressure_score desc
  const collisions = nodeArray
    .filter((n) => n.type === "collision")
    .sort((a, b) => (b.pressure_score || 0) - (a.pressure_score || 0));
  fs.writeFileSync(
    path.join(OUT_DIR, "collisions.json"),
    JSON.stringify(collisions, null, 0)
  );

  // sparks.json — sorted by age desc
  const sparks = nodeArray
    .filter((n) => n.type === "spark")
    .sort((a, b) => b.age_days - a.age_days);
  fs.writeFileSync(
    path.join(OUT_DIR, "sparks.json"),
    JSON.stringify(sparks, null, 0)
  );

  // search-index.json — lightweight, no full content
  const searchIndex = nodeArray.map((n) => ({
    id: n.id,
    title: n.title,
    type: n.type,
    domain: n.domain,
    status: n.status,
    excerpt: n.excerpt,
    path: n.path,
    color: n.color,
  }));
  fs.writeFileSync(
    path.join(OUT_DIR, "search-index.json"),
    JSON.stringify(searchIndex, null, 0)
  );

  // timeline.json
  const timeline = parseLogFiles();
  fs.writeFileSync(
    path.join(OUT_DIR, "timeline.json"),
    JSON.stringify(timeline, null, 0)
  );

  // domain-[name].json — one per domain
  const domains = [...new Set(nodeArray.map((n) => n.domain))];
  for (const domain of domains) {
    const safeDomain = domain.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const domainNodes = nodeArray
      .filter((n) => n.domain === domain)
      .sort((a, b) => b.sources - a.sources);
    fs.writeFileSync(
      path.join(OUT_DIR, `domain-${safeDomain}.json`),
      JSON.stringify(domainNodes, null, 0)
    );
  }

  // domain-index-[name].json — parsed domain index md files for Full Index tab
  const DOMAIN_INDEX_DIR = path.join(VAULT_PATH, "ARCHIVES/domain-indexes");
  if (fs.existsSync(DOMAIN_INDEX_DIR)) {
    const META_TITLES = ["Hub Pages", "Known Gaps", "Structural Notes", "Cross-Domain Triage", "Almost-Ready", "Clusters approaching"];
    for (const file of fs.readdirSync(DOMAIN_INDEX_DIR).filter(f => f.endsWith(".md"))) {
      const domainName = file.replace(".md", "");
      const raw = fs.readFileSync(path.join(DOMAIN_INDEX_DIR, file), "utf-8");
      const lines = raw.split("\n");
      const sections: object[] = [];
      let current: { title: string; level: number; concepts: object[]; isMeta: boolean } | null = null;

      for (const line of lines) {
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);
        const conceptLink = line.match(/^- \[\[ARCHIVES\/concepts\/([\w-]+)\/([\w-]+)\|(.*?)\]\](.*)/);

        if (h2) {
          if (current && current.concepts.length > 0) sections.push(current);
          const title = h2[1].trim();
          current = { title, level: 2, concepts: [], isMeta: META_TITLES.some(m => title.includes(m)) };
        } else if (h3) {
          if (current && current.concepts.length > 0) sections.push(current);
          const title = h3[1].trim();
          current = { title, level: 3, concepts: [], isMeta: META_TITLES.some(m => title.includes(m)) };
        } else if (conceptLink && current && !current.isMeta) {
          const [, domain, slug, title, rest] = conceptLink;
          const descParts = (rest || "").split("|");
          const description = descParts[0].replace(/^[\s\u2014\-]+/, "").trim();
          const statusMatch = rest.match(/status:\s*([\w-]+)/);
          const sourcesMatch = rest.match(/sources:\s*(\d+)/);
          current.concepts.push({
            slug,
            title,
            description,
            status: statusMatch?.[1] || undefined,
            sources: sourcesMatch ? parseInt(sourcesMatch[1]) : undefined,
            isHub: domain === "hubs",
          });
        }
      }
      if (current && current.concepts.length > 0) sections.push(current);
      fs.writeFileSync(
        path.join(OUT_DIR, `domain-index-${domainName}.json`),
        JSON.stringify(sections.filter((s: any) => !s.isMeta && s.concepts.length > 0), null, 0)
      );
    }
    console.log(`   Domain index files written`);
  }

  // essays.json
  const essays = nodeArray
    .filter((n) => n.type === "essay")
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  fs.writeFileSync(
    path.join(OUT_DIR, "essays.json"),
    JSON.stringify(essays, null, 0)
  );

  // stats.json — dashboard counters
  const stats = {
    total_concepts: nodeArray.filter((n) => n.type === "concept").length,
    total_hubs: nodeArray.filter((n) => n.type === "hub").length,
    total_sources: nodeArray.filter((n) => n.type === "source").length,
    total_sparks: sparks.length,
    total_collisions: collisions.length,
    domains: Object.fromEntries(
      domains.map((d) => [
        d,
        {
          count: nodeArray.filter(
            (n) => n.domain === d && n.type === "concept"
          ).length,
          collisions: collisions.filter((c) => c.domain === d).length,
          sparks: sparks.filter((s) => s.domain === d).length,
          color: DOMAIN_COLORS[d] || DOMAIN_COLORS.unknown,
        },
      ])
    ),
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "stats.json"),
    JSON.stringify(stats, null, 0)
  );

  console.log(`✅ Built:`);
  console.log(`   ${nodeArray.length} nodes (${collisions.length} collisions, ${sparks.length} sparks)`);
  console.log(`   ${edges.length} edges`);
  console.log(`   ${domains.length} domain files`);
  console.log(`   ${timeline.length} timeline entries`);
  console.log(`   Output: ${OUT_DIR}`);
}

function inferDomain(relPath: string): string {
  if (relPath.includes("eastern-spirituality")) return "eastern-spirituality";
  if (relPath.includes("african-spirituality")) return "african-spirituality";
  if (relPath.includes("behavioral-mechanics")) return "behavioral-mechanics";
  if (relPath.includes("creative-practice")) return "creative-practice";
  if (relPath.includes("ai-collaboration")) return "ai-collaboration";
  if (relPath.includes("cross-domain")) return "cross-domain";
  if (relPath.includes("psychology")) return "psychology";
  if (relPath.includes("history")) return "history";
  return "unknown";
}

function inferType(relPath: string): string {
  if (relPath.includes("LAB/Collisions")) return "collision";
  if (relPath.includes("LAB/Sparks")) return "spark";
  if (relPath.includes("LAB/Threads")) return "thread";
  if (relPath.includes("ARCHIVES/sources")) return "source";
  if (relPath.includes("concepts/hubs")) return "hub";
  if (relPath.includes("ARCHIVES/concepts")) return "concept";
  if (relPath.includes("The Platform/Essays")) return "essay";
  return "concept";
}

buildVault().catch(console.error);
