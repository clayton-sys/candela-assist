"use client";

import Link from "next/link";
import CandelaLogo from "@/components/ui/CandelaLogo";
import { GradientDivider } from "@/components/ui/GradientDivider";

const PRODUCT_LINKS = [
  { label: "Grant Suite", href: "/app/grant-suite" },
  { label: "Candela Assist", href: "/app/assist" },
  { label: "Academy", href: "/academy" },
  { label: "Pricing", href: "/pricing" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Blog (coming soon)", href: "#" },
  { label: "Changelog", href: "#" },
  { label: "Contact", href: "mailto:hello@candela.education" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "#" },
];

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "rgba(237,232,222,0.4)",
  textDecoration: "none",
  transition: "color 150ms ease",
  display: "block",
  padding: "3px 0",
};

const columnHeaderStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(237,232,222,0.3)",
  marginBottom: 12,
};

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div style={columnHeaderStyle}>{title}</div>
      <nav>
        {links.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(237,232,222,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(237,232,222,0.4)";
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function PublicFooter() {
  return (
    <footer>
      <GradientDivider />
      <div
        style={{
          background: "#06101a",
          borderTop: "0.5px solid rgba(237,232,222,0.04)",
          padding: "64px 24px 40px",
        }}
      >
        {/* 4-column grid */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 40,
          }}
          className="sm:[grid-template-columns:35%_1fr_1fr_1fr]"
        >
          {/* Column 1 — Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CandelaLogo size={28} />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  color: "var(--stone)",
                }}
              >
                Candela
                <span style={{ color: "#E9C03A" }}>.</span>
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "rgba(237,232,222,0.4)",
                marginTop: 12,
              }}
            >
              La luz que guía.
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "rgba(237,232,222,0.25)",
                marginTop: 8,
              }}
            >
              © 2026 CG Consulting LLC d/b/a Candela
            </div>
          </div>

          {/* Column 2 — Products */}
          <FooterLinkColumn title="Products" links={PRODUCT_LINKS} />

          {/* Column 3 — Company */}
          <FooterLinkColumn title="Company" links={COMPANY_LINKS} />

          {/* Column 4 — Legal */}
          <FooterLinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            paddingTop: 24,
            marginTop: 40,
            borderTop: "0.5px solid rgba(237,232,222,0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(237,232,222,0.3)",
            }}
          >
            hello@candela.education
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "rgba(237,232,222,0.25)",
            }}
          >
            La luz que guía.
          </span>
        </div>
      </div>
    </footer>
  );
}
