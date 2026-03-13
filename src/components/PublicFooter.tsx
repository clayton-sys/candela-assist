import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Grant Suite", href: "/app/grant-suite" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-midnight flex-shrink-0 border-t border-stone/5 print-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left */}
        <span className="font-jost text-[11px] text-stone/40">
          &copy; 2026 Candela &middot;{" "}
          <a
            href="https://candela.education"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone/60 transition-colors"
          >
            candela.education
          </a>
        </span>

        {/* Center */}
        <div className="hidden sm:flex items-center gap-4">
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-jost text-[11px] text-stone/40 hover:text-stone/60 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <a
          href="mailto:hello@candela.education"
          className="font-jost text-[11px] text-stone/40 hover:text-stone/60 transition-colors"
        >
          hello@candela.education
        </a>
      </div>
    </footer>
  );
}
