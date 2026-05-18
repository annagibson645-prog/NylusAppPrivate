import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { truncateAtWord } from './lib/string-utils.js';

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
  "The Platform/Essays",
  "The Platform/Research",
];

const DOMAIN_COLORS: Record<string, string> = {
  history: "#e6c068",
  "eastern-spirituality": "#7c8df0",
  psychology: "#f59e0b",
  "behavioral-mechanics": "#a78bfa",
  "cross-domain": "#5fc9a8",
  "creative-practice": "#ef5a6f",
  "african-spirituality": "#34d399",
  "ai-collaboration": "#9ca3af",
  unknown: "#6b7280",
};

// ── Hub section parsing constants (single source of truth — page.tsx reads pre-parsed data) ──
const HUB_SKIP_SECTIONS = new Set([
  'what this hub covers', 'how to navigate this hub', 'key tensions',
  'key tensions in this area', 'related hubs', 'structural notes',
  'overview', 'convergence points', 'source node', 'sources',
]);
const HUB_LEVEL_ORDER: Record<string, number> = { foundational: 0, intermediate: 1, advanced: 2, thematic: 3 };
const HUB_LEVEL_BADGE: Record<string, string> = { foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced', thematic: '' };
const HUB_LEVEL_COLOR: Record<string, string> = { foundational: '#6bab8a', intermediate: '#c8a460', advanced: '#9f7ec0', thematic: '#4a4468' };

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
  concepts?: string[];
  sections?: HubSection[];
}

interface HubSection {
  key: string;
  label: string;
  level: string;
  badge: string;
  color: string;
  concepts: string[];
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
  return match ? truncateAtWord(match[1].trim(), 400) : "";
}

function parseHubSections(content: string, validConceptIds: Set<string>): HubSection[] {
  const sections: HubSection[] = [];
  let current: HubSection | null = null;
  const seen = new Set<string>();

  for (const line of content.split('\n')) {
    if (/^## /.test(line)) {
      const raw = line.replace(/^## /, '').trim();
      const lower = raw.toLowerCase().replace(/[🗺️🔗🛠️]/gu, '').trim();
      if (HUB_SKIP_SECTIONS.has(lower)) { current = null; continue; }

      let level = 'thematic';
      if (/beginner/i.test(raw)) level = 'foundational';
      else if (/intermediate/i.test(raw)) level = 'intermediate';
      else if (/advanced/i.test(raw)) level = 'advanced';

      const label = raw
        .replace(/[🗺️🔗🛠️]/gu, '')
        .replace(/^(beginner|intermediate|advanced)(\s+level)?[:\s—\-]*/i, '')
        .trim();

      current = { key: raw, label: label || raw, level, badge: HUB_LEVEL_BADGE[level] ?? '', color: HUB_LEVEL_COLOR[level] ?? '#4a4468', concepts: [] };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const wikiRe = /\[\[ARCHIVES\/concepts\/[^/]+\/([^|\]]+)[|\]]/g;
    let m: RegExpExecArray | null;
    while ((m = wikiRe.exec(line)) !== null) {
      const id = m[1].trim();
      if (validConceptIds.has(id) && !seen.has(id)) {
        current.concepts.push(id);
        seen.add(id);
      }
    }
  }

  return sections
    .filter(s => s.concepts.length > 0)
    .sort((a, b) => (HUB_LEVEL_ORDER[a.level] ?? 3) - (HUB_LEVEL_ORDER[b.level] ?? 3));
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
  return truncateAtWord(stripMarkdown(best).replace(/\s+/g, " ").trim(), 200);
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

// ── Hub file validator ───────────────────────────────────────────────────────
// Runs before every build pass. Detects truncated wikilinks (lines that open [[
// but never close with ]]) and reports them with file + line number so the
// problem surfaces immediately rather than silently producing hub=undefined
// on affected concepts.
function validateHubFiles(hubsDir: string): number {
  if (!fs.existsSync(hubsDir)) return 0;

  // Matches a line that contains [[ but has no closing ]] anywhere on that line
  const truncatedLink = /\[\[[^\]]*$/;
  let errorCount = 0;

  for (const hubFile of walkDir(hubsDir)) {
    const content = fs.readFileSync(hubFile, "utf-8");
    const lines = content.split("\n");
    const relFile = path.relative(hubsDir, hubFile);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (truncatedLink.test(line)) {
        const preview = line.trim().slice(0, 80);
        console.warn(`⚠️  TRUNCATED LINK  ${relFile}  line ${i + 1}`);
        console.warn(`   → ${preview}…`);
        errorCount++;
      }
    }
  }

  if (errorCount > 0) {
    console.warn(`\n⛔ ${errorCount} truncated wikilink(s) found in hub files.`);
    console.warn(`   These concepts will have hub=undefined in graph.json.`);
    console.warn(`   Fix the broken links before re-running sync.\n`);
  } else {
    console.log(`✅ Hub validation passed — no truncated wikilinks.`);
  }

  return errorCount;
}

// ── Main build ───────────────────────────────────────────────────────────────
async function buildVault() {
  console.log("🔍 Scanning vault at:", VAULT_PATH);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Validate hub files FIRST — truncated wikilinks silently drop hub assignments
  const hubsDir = path.join(VAULT_PATH, "ARCHIVES/concepts/hubs");
  validateHubFiles(hubsDir);

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
    // gray-matter parses YYYY-MM-DD as a Date object (UTC midnight) — keep as string to avoid timezone shift
    const created = fm.created
      ? fm.created instanceof Date
        ? fm.created.toISOString().slice(0, 10)
        : String(fm.created)
      : "";
    const age = daysSince(created);

    const node: VaultNode = {
      id: slug,
      title,
      type,
      subtype: fm.subtype,
      domain,
      status: fm.status || "stub",
      created,
      updated: fm.updated
        ? fm.updated instanceof Date
          ? fm.updated.toISOString().slice(0, 10)
          : String(fm.updated)
        : created,
      sources: Number(fm.sources) || 0,
      path: relPath,
      content: raw,
      excerpt: fm.excerpt ? String(fm.excerpt) : generateExcerpt(content, title),
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
    if (type === "essay" || type === "research") {
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

  // Third pass: resolve hub membership + pre-parse sections (single parse, no dual-logic drift)
  if (fs.existsSync(hubsDir)) {
    for (const hubFile of walkDir(hubsDir)) {
      const hubSlug = slugify(hubFile);
      const hubNode = nodes.get(hubSlug);
      if (hubNode) { hubNode.concepts = []; hubNode.sections = []; }
      const { content: hubContent } = matter(fs.readFileSync(hubFile, "utf-8"));

      // All concept IDs linked anywhere in this hub (for graph relationships)
      const allLinkedConcepts = new Set<string>();
      for (const ls of extractWikilinks(hubContent)) {
        const target = nodes.get(ls);
        if (target && target.type === "concept") {
          target.hub = hubSlug; // graph edge: belongs to this hub
          allLinkedConcepts.add(ls);
        }
      }

      // Parse sections using the SAME skip logic as the renderer — only placed concepts go in hub.concepts
      if (hubNode) {
        const sections = parseHubSections(hubContent, allLinkedConcepts);
        const placedIds = new Set(sections.flatMap(s => s.concepts));
        hubNode.sections = sections;
        hubNode.concepts = [...placedIds]; // only section-placed concepts — zero ungrouped guaranteed
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

  // domain-[name].json — one per known domain (skip unknown)
  const KNOWN_DOMAINS = [
    "history", "eastern-spirituality", "african-spirituality",
    "psychology", "behavioral-mechanics", "cross-domain",
    "creative-practice", "ai-collaboration",
  ];
  const domains = KNOWN_DOMAINS.filter((d) =>
    nodeArray.some((n) => n.domain === d)
  );
  // Also write unknown for any orphaned pages (used internally, not shown on site)
  const allDomains = [...new Set(nodeArray.map((n) => n.domain))];
  for (const domain of allDomains) {
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

  // hubs.json — pre-parsed, no raw content (content caused file bloat + JSON corruption)
  const hubs = nodeArray
    .filter((n) => n.type === "hub" && n.status === "active")
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id))
    .map((n) => ({
      id: n.id,
      title: n.title,
      domain: n.domain,
      color: DOMAIN_COLORS[n.domain] || DOMAIN_COLORS.unknown,
      excerpt: n.excerpt,
      status: n.status,
      path: n.path,
      covers: (n.concepts || []).length,
      concepts: n.concepts || [],   // only section-placed concepts
      sections: n.sections || [],   // pre-parsed sections — page.tsx reads this directly
    }));
  fs.writeFileSync(
    path.join(OUT_DIR, "hubs.json"),
    JSON.stringify(hubs, null, 0)
  );

  // essays.json
  const essays = nodeArray
    .filter((n) => n.type === "essay")
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  fs.writeFileSync(
    path.join(OUT_DIR, "essays.json"),
    JSON.stringify(essays, null, 0)
  );

  // research.json
  const research = nodeArray
    .filter((n) => n.type === "research")
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  fs.writeFileSync(
    path.join(OUT_DIR, "research.json"),
    JSON.stringify(research, null, 0)
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

  const unknownCount = nodeArray.filter((n) => n.domain === "unknown").length;
  console.log(`✅ Built:`);
  console.log(`   ${nodeArray.length} nodes (${collisions.length} collisions, ${sparks.length} sparks)`);
  console.log(`   ${edges.length} edges`);
  console.log(`   ${domains.length} domains${unknownCount > 0 ? ` (+ ${unknownCount} uncategorized)` : ""}`);
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
  if (relPath.includes("The Platform/Research")) return "research";
  if (relPath.includes("ARCHIVES/sources")) return "source";
  if (relPath.includes("concepts/hubs")) return "hub";
  if (relPath.includes("ARCHIVES/concepts")) return "concept";
  if (relPath.includes("The Platform/Essays")) return "essay";
  return "concept";
}

buildVault().catch(console.error);
