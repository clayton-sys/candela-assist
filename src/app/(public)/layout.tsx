import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 border-b border-gold/20 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 45%, #3A6B8A 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 sm:py-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-5 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/candela-logo-primary.svg"
              alt="Candela"
              width={120}
              height={120}
              className="flex-shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="font-fraunces font-medium text-5xl sm:text-6xl text-stone leading-none tracking-tight">
                Candela
              </span>
              <span className="font-mono text-[11px] text-gold opacity-60 leading-tight tracking-[0.22em]">
                La luz que guía
              </span>
            </div>
          </a>
          <a
            href="https://candela.education"
            target="_blank"
            rel="noopener noreferrer"
            className="font-jost text-stone/50 hover:text-gold text-sm transition-colors hidden sm:block"
          >
            candela.education
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-midnight flex-shrink-0 border-t border-stone/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <p className="font-jost font-light text-stone/30 text-xs leading-relaxed">
            Candela Assist is a tool to support, not replace, professional
            judgment. Always review and edit AI-generated drafts before use.
          </p>
        </div>
      </footer>
    </div>
  );
}
