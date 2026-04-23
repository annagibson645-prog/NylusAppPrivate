import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Nav from "@/components/Nav";
import GlobalSidebar from "@/components/GlobalSidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NylusS",
  description: "Intelligence layer for the NylusS knowledge vault",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var t = localStorage.getItem('nyluss-theme');
              if (t === 'light') document.documentElement.classList.add('light');
            } catch(e) {}
          })();
        `}</Script>
        <Nav />
        <div className="flex flex-1 min-h-0">
          <GlobalSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
