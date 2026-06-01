import { readFileSync } from "fs";
import path from "path";
import Nav from "@/components/Nav";
import ResearchLoom from "@/components/ResearchLoom";

export const dynamic = "force-dynamic";

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

export default function ResearchPage() {
  const reports = loadJSON<any[]>("research.json");

  return (
    <>
      <Nav />
      <div className="void-page">
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto" }} className="px-4 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-40">

        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em", color: "#e8b86a", textTransform: "uppercase", marginBottom: "24px", opacity: 0.75 }}>
          research · synthesis layer
        </div>

        <h1 className="void-title">The Corpus</h1>

        <p className="void-lede" style={{ "--domain-color": "#e8b86a" } as React.CSSProperties}>
          A synthesis archive. Each card is a research report — click once to reveal the abstract, click again to open.
        </p>

        <ResearchLoom reports={reports} />

      </div>
      </div>
    </>
  );
}
