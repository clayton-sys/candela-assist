"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";
import CandelaLogo from "@/components/ui/CandelaLogo";
import Button from "@/components/ui/Button";

interface PublicNavProps {
  variant?: "default" | "logic-model";
}

const NAV_LINKS = [
  { label: "Grants & Reporting Suite", href: "/app/grants-reporting-suite" },
  { label: "Candela Assist", href: "/app/assist" },
  { label: "Academy", href: "/academy" },
  { label: "Pricing", href: "/pricing" },
];

export default function PublicNav({ variant = "default" }: PublicNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsLoggedIn(!!session);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session);
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase env vars not configured — default to logged-out state
    }
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(15,28,39,0.98)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: 60,
        borderBottom: "0.5px solid rgba(233,192,58,0.08)",
      }}
      className="print-hidden"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          padding: "0 48px",
        }}
      >
        {/* Left — Logo + wordmark */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            transition: "opacity 150ms",
          }}
        >
          <CandelaLogo size={32} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              color: "var(--stone)",
              lineHeight: 1,
            }}
          >
            Candela
            <span style={{ color: "#E9C03A" }}>.</span>
          </span>
        </Link>

        {/* Center — Desktop nav links */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            gap: 32,
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                letterSpacing: "0.04em",
                color: isActive(href)
                  ? "#E9C03A"
                  : "rgba(237,232,222,0.45)",
                textDecoration: "none",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive(href)) {
                  e.currentTarget.style.color = "rgba(237,232,222,1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) {
                  e.currentTarget.style.color = "rgba(237,232,222,0.45)";
                }
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right — CTA (desktop) */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 16 }}>
          {isLoggedIn ? (
            <Button variant="cta" size="sm" href="/app">
              Go to app &rarr;
            </Button>
          ) : (
            <Button variant="cta" size="sm" href="mailto:hello@candela.education">
              Get started &rarr;
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((s) => !s)}
          className="md:hidden"
          style={{
            color: "rgba(237,232,222,0.6)",
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(237,232,222,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(237,232,222,0.6)";
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            background: "rgba(15,28,39,0.98)",
            borderTop: "0.5px solid rgba(237,232,222,0.06)",
            padding: "8px 16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 12px",
                borderRadius: 8,
                textDecoration: "none",
                transition: "all 150ms",
                color: isActive(href)
                  ? "#E9C03A"
                  : "rgba(237,232,222,0.6)",
                background: isActive(href)
                  ? "rgba(233,192,58,0.1)"
                  : "transparent",
              }}
            >
              {label}
            </Link>
          ))}

          <div
            style={{
              borderTop: "0.5px solid rgba(237,232,222,0.06)",
              marginTop: 8,
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {isLoggedIn ? (
              <Link
                href="/app"
                onClick={closeMenu}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#5a8fad",
                  padding: "10px 12px",
                  textDecoration: "none",
                }}
              >
                Go to app &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(237,232,222,0.6)",
                    padding: "10px 12px",
                    textDecoration: "none",
                    transition: "color 150ms",
                  }}
                >
                  Sign in
                </Link>
                <div style={{ padding: "0 12px" }}>
                  <Button
                    variant="cta"
                    size="sm"
                    href="mailto:hello@candela.education"
                  >
                    Get started &rarr;
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
