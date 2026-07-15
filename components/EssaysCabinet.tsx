"use client";

// components/EssaysCabinet.tsx — the /essays landing experience: a cabinet of
// domains (same sigil + plate mechanic as /tones) that drills into an
// "Observatory Plate" view per domain — the newest essay as an asymmetric
// hero with its domain sigil in a glass specimen ring, older essays below as
// unbordered plates lit by a single hairline glow. Real starfield background
// (components/ShootingStars.tsx), same domain colors as /tones and /research.
import { useMemo, useState } from "react";
import Link from "next/link";
import ShootingStars from "@/components/ShootingStars";
import { DomainIcon, DOMAIN_ICON_KEYFRAMES } from "@/components/DomainIcon";
import { DOMAIN_LIST, domainColor, domainName, type DomainKey } from "@/lib/domains";

export type EssayNode = {
  id: string; title: string; domain: string | null; excerpt: string;
  word_count: number; created: string; status: string;
};

function formatDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function readTime(words: number) {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}
function isKnownDomain(d: string | null): d is DomainKey {
  return !!d && DOMAIN_LIST.some((x) => x.key === d);
}

export default function EssaysCabinet({ essays }: { essays: EssayNode[] }) {
  const [screen, setScreen] = useState<"cabinet" | "domain">("cabinet");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  // Group essays by domain — anything unrecognized falls to Cross-Domain,
  // same default the vault's own build step already uses.
  const byDomain = useMemo(() => {
    const m = new Map<string, EssayNode[]>();
    for (const e of essays) {
      const key = isKnownDomain(e.domain) ? e.domain : "cross-domain";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    for (const list of m.values()) list.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    return m;
  }, [essays]);

  const presentDomains = useMemo(
    () => DOMAIN_LIST.filter((d) => byDomain.has(d.key)),
    [byDomain],
  );

  const activeList = activeDomain ? byDomain.get(activeDomain) || [] : [];
  const featured = activeList[0];
  const earlier = activeList.slice(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DOMAIN_ICON_KEYFRAMES + CSS }} />
      <ShootingStars density={1} />

      <div className="ec-wrap">
        {screen === "cabinet" ? (
          essays.length === 0 ? (
            <div className="ec-empty"><p>No essays yet.</p></div>
          ) : (
            <div className="ec-cab-grid">
              {presentDomains.map((d) => {
                const list = byDomain.get(d.key)!;
                return (
                  <button key={d.key} type="button" className="ec-cab-plate"
                    style={{ ["--dc" as string]: d.color }}
                    onClick={() => { setActiveDomain(d.key); setScreen("domain"); }}
                    aria-label={`Browse ${d.name} — ${list.length} essay${list.length === 1 ? "" : "s"}`}>
                    <div className="ec-cab-orb">
                      <DomainIcon domainKey={d.key} color={d.color} style={{ width: 30, height: 30 }} />
                    </div>
                    <p className="ec-cab-name">{d.name}</p>
                    <p className="ec-cab-stat">{list.length} essay{list.length === 1 ? "" : "s"}</p>
                    <p className="ec-cab-hint">tap to browse <span aria-hidden>→</span></p>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          activeDomain && (
            <>
              <div className="ec-dom-head">
                <button type="button" className="ec-back" onClick={() => { setScreen("cabinet"); setActiveDomain(null); }}>
                  ← All Domains
                </button>
                <div className="ec-dom-id">
                  <div className="ec-dom-icon" style={{ ["--dc" as string]: domainColor(activeDomain) }}>
                    <DomainIcon domainKey={activeDomain} color={domainColor(activeDomain)} style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <h2 className="ec-dom-name">{domainName(activeDomain)}</h2>
                    <p className="ec-dom-stat">{activeList.length} essay{activeList.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </div>

              {featured && (
                <Link href={`/essay/${featured.id}`} className="ec-hero" style={{ ["--dc" as string]: domainColor(activeDomain) }}>
                  <div>
                    <div className="ec-hero-eyebrow"><span className="ec-sq" />Latest · {domainName(activeDomain)}</div>
                    <h3 className="ec-hero-title">{featured.title}</h3>
                    <p className="ec-hero-excerpt">{featured.excerpt}</p>
                    <p className="ec-hero-meta">{formatDate(featured.created)} · {featured.word_count.toLocaleString()} words · {readTime(featured.word_count)}</p>
                  </div>
                  <div className="ec-plate-wrap">
                    <div className="ec-plate-ring" aria-hidden="true" />
                    <DomainIcon domainKey={activeDomain} color={domainColor(activeDomain)} style={{ width: 56, height: 56 }} />
                  </div>
                </Link>
              )}

              {earlier.length > 0 && (
                <>
                  <p className="ec-earlier-label">Earlier</p>
                  <div className="ec-grid">
                    {earlier.map((e, i) => (
                      <Link key={e.id} href={`/essay/${e.id}`} className="ec-card"
                        style={{ ["--dc" as string]: domainColor(activeDomain), ["--i" as string]: i } as React.CSSProperties}>
                        <div className="ec-card-top">
                          <DomainIcon domainKey={activeDomain} color={domainColor(activeDomain)} style={{ width: 18, height: 18 }} />
                          <span className="ec-card-domain">{domainName(activeDomain)}</span>
                        </div>
                        <div className="ec-card-title">{e.title}</div>
                        <div className="ec-card-excerpt">{e.excerpt}</div>
                        <div className="ec-card-meta">{formatDate(e.created)} · {readTime(e.word_count)}</div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )
        )}
      </div>
    </>
  );
}

const CSS = `
.ec-wrap{position:relative;z-index:1;}
.ec-empty{padding:70px 10px;text-align:center;}
.ec-empty p{font-family:var(--font-newsreader),serif;font-style:italic;font-size:20px;color:var(--text-muted);margin:0;}

/* cabinet */
.ec-cab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;}
.ec-cab-plate{position:relative;text-align:left;cursor:pointer;border:1px solid var(--border);border-radius:12px;
  padding:26px 22px 22px;overflow:hidden;background:color-mix(in srgb,var(--surface) 55%,transparent);
  transition:border-color .2s,transform .2s;}
.ec-cab-plate::before{content:"";position:absolute;inset:0;
  background:radial-gradient(120% 140% at 12% -10%, color-mix(in srgb,var(--dc) 12%,transparent), transparent 60%);
  pointer-events:none;}
.ec-cab-plate:hover{border-color:color-mix(in srgb,var(--dc) 45%,var(--border));transform:translateY(-3px);}
.ec-cab-plate:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,#60a5fa 55%,transparent);}
.ec-cab-orb{position:relative;width:60px;height:60px;margin:0 0 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--dc) 28%,transparent), transparent 72%);}
.ec-cab-name{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:19px;color:var(--text);margin:0 0 8px;position:relative;}
.ec-cab-stat{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin:0 0 14px;font-variant-numeric:tabular-nums;position:relative;}
.ec-cab-hint{font-family:var(--font-jetbrains),monospace;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:0;position:relative;
  display:flex;align-items:center;gap:6px;transition:color .2s,gap .2s;}
.ec-cab-plate:hover .ec-cab-hint{color:var(--dc);gap:9px;}

/* domain header */
.ec-dom-head{display:flex;align-items:center;gap:18px;margin:0 0 30px;flex-wrap:wrap;}
.ec-back{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);
  background:none;border:1px solid var(--border);border-radius:7px;padding:9px 13px;cursor:pointer;transition:color .18s,border-color .18s;flex-shrink:0;}
.ec-back:hover{color:var(--text);border-color:var(--text-dim);}
.ec-dom-id{display:flex;align-items:center;gap:14px;min-width:0;}
.ec-dom-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--dc) 28%,transparent), transparent 72%);}
.ec-dom-name{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:clamp(22px,3.6vw,30px);color:var(--text);margin:0;line-height:1.05;}
.ec-dom-stat{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin:6px 0 0;}

/* hero — observatory plate */
.ec-hero{display:grid;grid-template-columns:1fr 150px;gap:32px;align-items:center;padding:8px 0 40px;
  border-bottom:1px solid var(--border);margin-bottom:36px;text-decoration:none;cursor:pointer;color:inherit;}
.ec-hero-eyebrow{display:flex;align-items:center;gap:10px;font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dc);margin:0 0 16px;}
.ec-sq{width:7px;height:7px;border-radius:2px;background:var(--dc);flex-shrink:0;}
.ec-hero-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:clamp(26px,4.2vw,38px);line-height:1.08;color:var(--text);margin:0 0 16px;}
.ec-hero-excerpt{font-family:var(--font-newsreader),serif;font-weight:300;font-size:16px;line-height:1.7;color:var(--text-muted);max-width:48ch;margin:0 0 14px;}
.ec-hero-meta{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin:0;}
.ec-plate-wrap{position:relative;width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 38% 32%, color-mix(in srgb,var(--dc) 30%,transparent), transparent 72%);flex-shrink:0;}
.ec-plate-ring{position:absolute;inset:12px;border-radius:50%;border:1px solid color-mix(in srgb,var(--dc) 28%,transparent);}

/* earlier grid */
.ec-earlier-label{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--text-dim);margin:0 0 16px;}
.ec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,320px));gap:18px;}
.ec-card{position:relative;display:block;text-decoration:none;color:inherit;background:color-mix(in srgb,var(--bg) 60%,var(--surface));
  border-radius:5px;padding:24px 22px 18px;cursor:pointer;overflow:hidden;
  animation:riseIn .5s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i,0)*110ms);
  transition:transform .22s,filter .22s;box-shadow:inset 0 0 0 1px var(--border);}
.ec-card::before{content:"";position:absolute;top:0;left:8%;right:8%;height:1px;
  background:linear-gradient(90deg,transparent,var(--dc),transparent);opacity:.7;}
.ec-card::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%, rgba(0,0,0,.25), transparent 65%);pointer-events:none;}
.ec-card:hover{transform:translateY(-4px);filter:brightness(1.1);}
.ec-card:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,#60a5fa 55%,transparent);}
.ec-card-top{display:flex;align-items:center;gap:10px;margin-bottom:14px;position:relative;}
.ec-card-domain{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--dc);}
.ec-card-title{font-family:var(--font-fraunces),serif;font-size:19px;font-weight:600;font-style:italic;line-height:1.2;color:var(--text);margin-bottom:10px;position:relative;}
.ec-card-excerpt{font-family:var(--font-newsreader),serif;font-size:13.5px;line-height:1.6;color:var(--text-muted);font-weight:300;margin-bottom:14px;position:relative;}
.ec-card-meta{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);position:relative;}

@keyframes riseIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@media (max-width:640px){
  .ec-hero{grid-template-columns:1fr;}
  .ec-plate-wrap{margin:0 auto;}
}
@media (prefers-reduced-motion:reduce){ .ec-card{animation:none;} }
`;
