"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Program {
  id: string;
  name: string;
  projects: Project[];
}

interface AppShellProps {
  userEmail?: string;
  programs?: Program[];
  children: React.ReactNode;
}

export default function AppShell({
  userEmail,
  programs = [],
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden below md */}
      <div className="hidden md:flex">
        <AppSidebar
          userEmail={userEmail}
          programs={programs}
        />
      </div>

      {/* Mobile hamburger button — visible below md */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-11 h-11 rounded-lg bg-[#1B2B3A]/80 backdrop-blur-sm"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EDE8DE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-[260ms] ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeDrawer}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-md text-[#EDE8DE]/50 hover:text-[#EDE8DE] transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <AppSidebar
          userEmail={userEmail}
          programs={programs}
          onNavClick={closeDrawer}
        />
      </div>

      {/* Main content area with TopBar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userEmail={userEmail} />
        <main className="flex-1 overflow-auto bg-[#EDE8DE]">{children}</main>
      </div>
    </div>
  );
}
