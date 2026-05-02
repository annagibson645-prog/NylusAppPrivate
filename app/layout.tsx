import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Fraunces, Newsreader } from "next/font/google";
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

export const metadata: Metadata = {
  title: "NylusS",
  description: "Intelligence layer for the NylusS knowledge vault",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    spaceGrotesk.variable,
    jetbrainsMono.variable,
    fraunces.variable,
    newsreader.variable,
  ].join(" ");

  return (
    <html lang="en" className={fontVars} style={{ height: "100%" }}>
      <body style={{ margin: 0, padding: 0, height: "100%", background: "#0e0d14" }}>
        {children}
      </body>
    </html>
  );
}
