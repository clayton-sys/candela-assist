import type { Metadata } from "next";
import Image from "next/image";
import { Fraunces, Jost, DM_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Candela Assist — AI Documentation for Case Managers",
  description:
    "Generate professional case management documentation drafts in seconds. Privacy-first. No client PII stored.",
  icons: {
    icon: "/candela-logo-primary.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen flex flex-col bg-stone text-midnight ${fraunces.variable} ${jost.variable} ${dmMono.variable} font-jost`}
      >
        {/* ── Header ── */}
        <header
          className="flex-shrink-0 border-b border-gold/20 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 45%, #3A6B8A 100%)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-7 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/candela-logo-primary.svg"
                alt="Candela"
                width={52}
                height={52}
                className="h-13 w-13 flex-shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-fraunces font-medium text-2xl text-stone leading-tight tracking-tight">
                  Candela
                </span>
                <span className="font-mono text-[10px] text-gold opacity-60 leading-tight tracking-[0.22em]">
                  La luz que guía
                </span>
              </div>
            </a>
            <a
              href="https://candela.education"
              target="_blank"
              rel="noopener noreferrer"
              className="font-jost text-stone/50 hover:text-gold text-sm transition-colors"
            >
              candela.education
            </a>
          </div>
        </header>

        {/* ── Main — pages manage their own layout and bg ── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer — slim disclaimer bar shown on all pages ── */}
        <footer className="bg-midnight flex-shrink-0 border-t border-stone/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <p className="font-jost font-light text-stone/30 text-xs leading-relaxed">
              Candela Assist is a tool to support, not replace, professional judgment. Always review and edit AI-generated drafts before use.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
