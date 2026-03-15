"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Home,
  ChevronDown,
  ChevronRight,
  Archive,
  Settings,
  LogOut,
  Circle,
} from "lucide-react";

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

interface AppSidebarProps {
  userEmail?: string;
  programs?: Program[];
  onNavClick?: () => void;
}

const STATUS_COLORS: Record<Project["status"], string> = {
  active: "#1D9E75",
  draft: "#BA7517",
  complete: "#3A6B8A",
};

export default function AppSidebar({
  userEmail,
  programs = [],
  onNavClick,
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedPrograms, setExpandedPrograms] = useState<
    Record<string, boolean>
  >({});
  const [archiveOpen, setArchiveOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleProgram(id: string) {
    setExpandedPrograms((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full border-r border-white/[0.06] bg-[#1B2B3A]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Logo / Org name */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link
          href="/app"
          onClick={onNavClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Image
            src={
              process.env.NEXT_PUBLIC_ORG_LOGO_URL ||
              "/candela-logo-primary.svg"
            }
            alt={process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela"}
            width={28}
            height={28}
            className="flex-shrink-0"
          />
          <div>
            <span
              className="text-[#EDE8DE] text-base leading-none block"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            >
              {process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela"}
            </span>
            <span className="text-[9px] text-[#E9C03A]/50 tracking-[0.18em] uppercase leading-none block mt-0.5">
              Assist
            </span>
          </div>
        </Link>
      </div>

      {/* New Project button */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/app/impact-studio?new=1"
          onClick={onNavClick}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-[#E9C03A] text-[#1B2B3A] text-sm font-semibold hover:bg-[#E9C03A]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
        {/* Workspace home */}
        <Link
          href="/app"
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/app"
              ? "bg-[#E9C03A]/15 text-[#E9C03A]"
              : "text-[#EDE8DE]/60 hover:text-[#EDE8DE] hover:bg-white/[0.05]"
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span>Workspace</span>
        </Link>

        {/* Programs section header */}
        <p className="text-[9px] text-[#EDE8DE]/25 uppercase tracking-[0.2em] px-3 mt-4 mb-1">
          Programs
        </p>

        {programs.length === 0 && (
          <p className="text-xs text-[#EDE8DE]/30 px-3 py-2 italic">
            No programs yet
          </p>
        )}

        {programs.map((program) => {
          const isExpanded = expandedPrograms[program.id] ?? false;
          return (
            <div key={program.id}>
              {/* Program row */}
              <button
                onClick={() => toggleProgram(program.id)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#EDE8DE]/70 hover:text-[#EDE8DE] hover:bg-white/[0.05] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-[#EDE8DE]/40" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-[#EDE8DE]/40" />
                )}
                <span
                  className="truncate font-medium"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  {program.name}
                </span>
                <span className="ml-auto text-[10px] text-[#EDE8DE]/30">
                  {program.projects.length}
                </span>
              </button>

              {/* Nested projects */}
              {isExpanded && (
                <div className="ml-4 border-l border-white/[0.06] pl-2">
                  {program.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/impact-studio?project=${project.id}`}
                      onClick={onNavClick}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[#EDE8DE]/50 hover:text-[#EDE8DE] hover:bg-white/[0.04] transition-colors"
                    >
                      <Circle
                        className="w-2 h-2 flex-shrink-0"
                        fill={STATUS_COLORS[project.status]}
                        stroke="none"
                      />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  ))}
                  {program.projects.length === 0 && (
                    <p className="text-[10px] text-[#EDE8DE]/20 px-2 py-1.5 italic">
                      No projects
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Archive section */}
        <div className="mt-4">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#EDE8DE]/40 hover:text-[#EDE8DE]/60 hover:bg-white/[0.04] transition-colors"
          >
            <Archive className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Archive</span>
            {archiveOpen ? (
              <ChevronDown className="w-3 h-3 ml-auto" />
            ) : (
              <ChevronRight className="w-3 h-3 ml-auto" />
            )}
          </button>
          {archiveOpen && (
            <div className="ml-4 pl-2 py-1">
              <p className="text-[10px] text-[#EDE8DE]/20 px-2 py-1 italic">
                No archived projects
              </p>
            </div>
          )}
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.06]" />

      {/* Bottom section: Org Settings + User */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {/* Org Settings trigger */}
        <Link
          href="/app/settings"
          onClick={onNavClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
            pathname.startsWith("/app/settings")
              ? "bg-[#E9C03A]/15 text-[#E9C03A]"
              : "text-[#EDE8DE]/40 hover:text-[#EDE8DE]/70 hover:bg-white/[0.04]"
          }`}
        >
          <Settings className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Org Settings</span>
        </Link>

        {/* User email + sign out */}
        <div className="px-3 pt-1">
          {userEmail && (
            <p className="text-[11px] text-[#EDE8DE]/35 mb-2 truncate leading-none">
              {userEmail}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[11px] text-[#EDE8DE]/40 hover:text-[#EDE8DE]/70 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
