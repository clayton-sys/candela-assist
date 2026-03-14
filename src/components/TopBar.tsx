"use client";

import { Search, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopBarProps {
  userEmail?: string;
  orgName?: string;
}

export default function TopBar({ userEmail, orgName }: TopBarProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // Derive initials from email
  const initials = userEmail
    ? userEmail
        .split("@")[0]
        .split(/[._-]/)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("")
    : "?";

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center justify-between px-5 bg-white border-b border-[#d8d2c4]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Left: Org name */}
      <div className="flex items-center gap-2">
        <span
          className="text-[#1B2B3A] text-lg leading-none"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          {orgName ?? "Candela Assist"}
        </span>
        {isAdmin && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#E9C03A] text-[#1B2B3A]">
            ADMIN
          </span>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2B3A]/30" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#EDE8DE]/50 border border-[#d8d2c4] text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/30 focus:outline-none focus:border-[#3A6B8A] focus:ring-1 focus:ring-[#3A6B8A]/30 transition-colors"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          />
        </div>
      </div>

      {/* Right: Notification bell + User avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#1B2B3A]/40 hover:text-[#1B2B3A]/70 hover:bg-[#EDE8DE]/60 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3A6B8A] text-white text-xs font-semibold select-none"
          title={userEmail}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
