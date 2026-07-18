import { readFileSync } from "fs";
import path from "path";
import NavG from "@/components/NavG";
import ThreadsLoom from "@/components/ThreadsLoom";

export const dynamic = "force-dynamic";

function loadJSON<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  );
}

export default function ThreadsPage() {
  let threads: any[] = [];
  try {
    threads = loadJSON<any[]>("threads.json");
  } catch { /* no threads yet */ }

  return (
    <>
      <NavG active="Threads" />
      <div className="void-page" style={{ "--domain-color": "#c084fc" } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px) 160px" }}>

        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em", color: "#c084fc", textTransform: "uppercase", marginBottom: "24px", opacity: 0.75 }}>
          thread generator output
        </div>

        <h1 className="void-title">The Loom</h1>

        <p className="void-lede" style={{ "--domain-color": "#c084fc" } as React.CSSProperties}>
          What every report already started — newsletter and wildcard series spun out of each research report, click once to reveal the excerpt, click again to open.
        </p>

        <ThreadsLoom threads={threads} />

      </div>
      </div>
    </>
  );
}
