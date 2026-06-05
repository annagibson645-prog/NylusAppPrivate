import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Fraunces, Newsreader, Cormorant_Garamond } from "next/font/google";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "500"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
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
