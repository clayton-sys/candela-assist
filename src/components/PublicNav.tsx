"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";

interface PublicNavProps {
  variant?: "default" | "logic-model";
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Grant Suite", href: "/app/grant-suite" },
  { label: "Candela Assist", href: "/app/assist" },
];

export default function PublicNav({ variant = "default" }: PublicNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const ctaLabel =
    variant === "logic-model"
      ? "Build one for your org \u2192"
      : "Request access";

  return (
    <nav className="sticky top-0 z-50 bg-midnight border-b-[3px] border-gold print-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left — Logo + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-150"
        >
          <Image
            src="/candela-logo-primary.svg"
            alt="Candela"
            width={24}
            height={24}
            className="flex-shrink-0"
          />
          <span className="font-fraunces text-stone text-lg leading-none">
            Candela
          </span>
        </Link>

        {/* Center — Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`font-jost text-[13px] font-medium transition-opacity duration-150 ${
                isActive(href)
                  ? "text-gold"
                  : "text-stone/70 hover:text-stone"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right — Auth-aware CTAs (desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/app"
              className="font-jost text-[13px] font-medium text-cerulean hover:text-stone transition-colors duration-150"
            >
              Go to app &rarr;
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-jost text-[13px] font-medium text-stone/70 hover:text-stone transition-opacity duration-150"
              >
                Sign in
              </Link>
              <a
                href="mailto:hello@candela.education"
                className="font-jost text-[13px] font-medium bg-gold text-midnight px-4 py-1.5 rounded-md hover:bg-gold-dark transition-colors duration-150"
              >
                {ctaLabel}
              </a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((s) => !s)}
          className="md:hidden text-stone/70 hover:text-stone transition-colors p-1"
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
        <div className="md:hidden bg-midnight border-t border-stone/10 px-4 pb-5 pt-2 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className={`font-jost text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                isActive(href)
                  ? "text-gold bg-gold/10"
                  : "text-stone/60 hover:text-stone hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="border-t border-stone/10 mt-2 pt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/app"
                onClick={closeMenu}
                className="font-jost text-sm font-medium text-cerulean py-2.5 px-3"
              >
                Go to app &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="font-jost text-sm font-medium text-stone/60 hover:text-stone py-2.5 px-3"
                >
                  Sign in
                </Link>
                <a
                  href="mailto:hello@candela.education"
                  onClick={closeMenu}
                  className="font-jost text-sm font-medium bg-gold text-midnight px-4 py-2.5 rounded-md text-center hover:bg-gold-dark transition-colors"
                >
                  {ctaLabel}
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
