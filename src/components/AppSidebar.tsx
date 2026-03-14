"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, BarChart3, LogOut } from "lucide-react";

interface AppSidebarProps {
  userEmail?: string;
  onNavClick?: () => void;
}

export default function AppSidebar({ userEmail, onNavClick }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      label: "Candela Assist",
      href: "/app/assist",
      icon: FileText,
      active: pathname.startsWith("/app/assist"),
    },
    {
      label: "Grants & Reporting Suite",
      href: "/app/grants-reporting-suite",
      icon: BarChart3,
      active: pathname.startsWith("/app/grants-reporting-suite"),
      isNew: true,
    },
  ];

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full border-r border-white/[0.06] bg-midnight">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Image
            src={process.env.NEXT_PUBLIC_ORG_LOGO_URL || "/candela-logo-primary.svg"}
            alt={process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela"}
            width={26}
            height={26}
            className="flex-shrink-0"
          />
          <div>
            <span className="font-fraunces text-stone text-base leading-none block">
              {process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela"}
            </span>
            <span className="font-mono text-[9px] text-gold/50 tracking-[0.18em] uppercase leading-none block mt-0.5">
              {process.env.NEXT_PUBLIC_APP_TITLE ?? "Candela Assist"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <p className="font-mono text-[9px] text-stone/25 uppercase tracking-[0.2em] px-2 mb-2">
          Products
        </p>
        {navItems.map(({ label, href, icon: Icon, active, isNew }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-jost transition-colors group ${
              active
                ? "bg-gold/15 text-gold"
                : "text-stone/50 hover:text-stone hover:bg-white/[0.05]"
            }`}
          >
            <Icon
              className={`w-4 h-4 flex-shrink-0 ${
                active ? "text-gold" : "text-stone/40 group-hover:text-stone/70"
              }`}
            />
            <span className="flex-1">{label}</span>
            {isNew && !active && (
              <span className="text-[9px] font-mono uppercase tracking-[0.1em] bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                New
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        {userEmail && (
          <p className="text-[11px] text-stone/35 font-jost mb-3 truncate leading-none">
            {userEmail}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[11px] text-stone/40 hover:text-stone/70 font-jost transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
