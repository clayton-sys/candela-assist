"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";

interface AppShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export default function AppShell({ userEmail, children }: AppShellProps) {
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
        <AppSidebar userEmail={userEmail} />
      </div>

      {/* Mobile hamburger button — visible below md */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-11 h-11 rounded-lg bg-midnight/80 backdrop-blur-sm"
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
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-[260ms] ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeDrawer}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-md text-stone/50 hover:text-stone transition-colors"
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

        <AppSidebar userEmail={userEmail} onNavClick={closeDrawer} />
      </div>

      <main className="flex-1 overflow-auto bg-stone">{children}</main>
    </div>
  );
}
