import type { Metadata } from "next";
import localFont from "next/font/local";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

// Every font is self-hosted. next/font/google downloads the binaries during the
// build, and that fetch fails intermittently on the deploy builder: the
// @font-face CSS is still emitted, now pointing at files that were never
// written, and the build dies with module-not-found. Newsreader moved here for
// that reason in 592a34a7; Fraunces and Cormorant Garamond then failed the same
// way on separate builds, so the remaining families followed rather than
// waiting their turn. Nothing is fetched from Google at build time now.
//
// All variable woff2, latin subset, declared with the full weight range each
// file carries — a narrower range here would clamp weights the CSS still asks
// for.
const spaceGrotesk = localFont({
  variable: "--font-space-grotesk",
  display: "swap",
  src: [{ path: "./fonts/SpaceGrotesk-latin-normal.woff2", weight: "300 700", style: "normal" }],
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains",
  display: "swap",
  src: [
    { path: "./fonts/JetBrainsMono-latin-normal.woff2", weight: "100 800", style: "normal" },
    { path: "./fonts/JetBrainsMono-latin-italic.woff2", weight: "100 800", style: "italic" },
  ],
});

const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "./fonts/Fraunces-latin-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Fraunces-latin-italic.woff2", weight: "100 900", style: "italic" },
  ],
});

const newsreader = localFont({
  variable: "--font-newsreader",
  display: "swap",
  src: [
    { path: "./fonts/Newsreader-latin-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/Newsreader-latin-italic.woff2", weight: "200 800", style: "italic" },
  ],
});

const cormorantGaramond = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "./fonts/CormorantGaramond-latin-normal.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/CormorantGaramond-latin-italic.woff2", weight: "300 700", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "NylusS",
  description: "Intelligence layer for the NylusS knowledge vault",
};

// Runs before React hydration — sets data-theme from localStorage to prevent flash.
// Defaults to 'void' (dark) if no preference saved.
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('nylus-theme');
    if (t === 'sepia' || t === 'void') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    spaceGrotesk.variable,
    jetbrainsMono.variable,
    fraunces.variable,
    newsreader.variable,
    cormorantGaramond.variable,
  ].join(" ");

  return (
    <html lang="en" className={fontVars} style={{ height: "100%" }} suppressHydrationWarning>
      <head>
        {/* No-flash theme init — runs before paint, sets data-theme on <html>. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body style={{ margin: 0, padding: 0, height: "100%" }}>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
