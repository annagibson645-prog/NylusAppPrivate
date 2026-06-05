import Link from "next/link";
import NavG from "@/components/NavG";

export const dynamic = "force-static";

const PROTOS = [
  { href: "/council/p1", n: "01", name: "Triptych Veil", desc: "Three luminous vertical panels; emblems drift slowly behind centered serif titles." },
  { href: "/council/p2", n: "02", name: "Parallax Void", desc: "Full starfield void; giant faint emblems parallax against the cursor." },
  { href: "/council/p3", n: "03", name: "Cathedral Arches", desc: "Three arched doorways of a council chamber; emblems breathe with light." },
  { href: "/council/p4", n: "04", name: "Living Emblem", desc: "Maximal — the emblem fills the field and moves; eye dilates, crown shimmers, hammer meets pen." },
  { href: "/council/p5", n: "05", name: "Orbital Sigils", desc: "Each emblem set inside slowly rotating alchemical rings." },
];

export default function CouncilGallery() {
  return (
    <>
      <NavG active="The Council" />
      <div className="void-page" style={{ minHeight: "100vh", position: "relative" }}>
        <div className="void-ambient" style={{ "--domain-color": "#e8b86a" } as React.CSSProperties} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto", padding: "64px clamp(20px,5vw,64px) 160px" }}>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#e8b86a", opacity: 0.8, marginBottom: 22 }}>
            prototypes · pick a direction
          </div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(36px,6vw,56px)", color: "var(--text)", margin: "0 0 18px" }}>
            The Inner Council
          </h1>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 640, margin: "0 0 48px" }}>
            Five home-page prototypes of the council door — Influence, Sovereignty, Craftsmanship.
            Open each, toggle light/dark, then tell me which to push on. Every quadrant already links
            through to its live council page.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {PROTOS.map((p) => (
              <Link key={p.href} href={p.href}
                style={{
                  display: "flex", gap: 20, alignItems: "baseline",
                  padding: "20px 22px", borderRadius: 12, textDecoration: "none",
                  border: "1px solid var(--border)", background: "var(--surface)",
                  transition: "border-color .2s, transform .2s",
                }}>
                <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontSize: 26, color: "#e8b86a", flexShrink: 0, width: 44 }}>{p.n}</span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Fraunces', Georgia, serif", fontSize: 21, color: "var(--text)", marginBottom: 5 }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 14, lineHeight: 1.5, color: "var(--text-muted)" }}>{p.desc}</span>
                </span>
                <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, flexShrink: 0 }}>→</span>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 40, paddingTop: 28, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-jetbrains), monospace", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "center" }}>council pages:</span>
            {[["influence","Influence"],["sovereignty","Sovereignty"],["craftsman","Craftsmanship"]].map(([k,label]) => (
              <Link key={k} href={`/council/${k}`} style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", borderBottom: "1px solid var(--border)", paddingBottom: 2 }}>{label} →</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
