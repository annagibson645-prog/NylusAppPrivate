"use client";
// CouncilStars — the constellation-style shooting-star field, themed for the
// Council. White streaks in the void (dark); coffee/ink streaks on parchment
// (light). Sits as a fixed background layer behind the page content.

import { useEffect, useState } from "react";
import ShootingStars from "@/components/ShootingStars";

export default function CouncilStars({
  density = 0.6,
  accent,
}: {
  density?: number;
  accent?: string;
}) {
  const [theme, setTheme] = useState<"void" | "sepia">("void");

  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "sepia" ? "sepia" : "void");
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const sepia = theme === "sepia";
  // White shooting stars in the void; coffee/ink shooting stars on parchment.
  const baseColor = sepia ? "92,68,38" : "255,255,255";
  const accentColors = sepia
    ? ["#6b4f2a", "#5c4a2a", "#7a5a2a", accent ?? "#8b6914"]
    : ["#ffffff", "#ffffff", "#ffffff", accent ?? "#ffffff"];

  return <ShootingStars baseColor={baseColor} density={density} accentColors={accentColors} />;
}
