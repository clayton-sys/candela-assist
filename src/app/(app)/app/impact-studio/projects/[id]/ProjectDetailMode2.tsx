"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus } from "lucide-react";

interface Run {
  id: string;
  version_number: number;
  is_latest: boolean;
  created_at: string;
}

interface ProjectDetailMode2Props {
  project: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    created_at: string;
  };
  runs: Run[];
  viewType: string | null;
  outputData: unknown;
}

const VIEW_TYPE_LABELS: Record<string, string> = {
  impact_snapshot: "Impact Snapshot",
  funder_narrative: "Funder Narrative Report",
  website_embed: "Website Embed",
  program_profile: "Program Profile",
  impact_command_center: "Impact Command Center",
  story_view: "Story View",
};

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  in_progress: { label: "In Progress", bg: "bg-[#3A6B8A]/10", text: "text-[#3A6B8A]" },
  waiting: { label: "Waiting", bg: "bg-[#BA7517]/10", text: "text-[#BA7517]" },
  ready: { label: "Ready", bg: "bg-[#1D9E75]/10", text: "text-[#1D9E75]" },
  complete: { label: "Complete", bg: "bg-[#E9C03A]/10", text: "text-[#E9C03A]" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ProjectDetailMode2({
  project,
  runs,
  viewType,
}: ProjectDetailMode2Props) {
  const router = useRouter();
  const [activeRunId, setActiveRunId] = useState<string | null>(
    runs[0]?.id ?? null
  );

  const statusCfg = STATUS_LABELS[project.status] ?? STATUS_LABELS.in_progress;
  const displayLabel =
    VIEW_TYPE_LABELS[viewType ?? ""] ??
    VIEW_TYPE_LABELS[project.project_type] ??
    "Interactive View";

  async function handleRunClick(runId: string) {
    setActiveRunId(runId);
    // Could load data for that run in the future
  }

  const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
  const cormorant = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  } as const;

  return (
    <div className="min-h-screen bg-[#EDE8DE] flex flex-col items-center">
      {/* Back link */}
      <div className="w-full max-w-2xl px-6 pt-8">
        <button
          onClick={() => router.push("/app/impact-studio")}
          className="flex items-center gap-1 text-sm text-[#1B2B3A]/50 hover:text-[#1B2B3A]/70 transition-colors mb-6"
          style={dmSans}
        >
          <ChevronLeft className="w-4 h-4" />
          Projects
        </button>

        {/* Project name */}
        <h1
          className="text-[28px] font-semibold text-[#1B2B3A] leading-tight mb-2"
          style={cormorant}
        >
          {project.name}
        </h1>

        {/* Metadata */}
        <p className="text-[13px] text-[#1B2B3A]/50 mb-2" style={dmSans}>
          {displayLabel} · {new Date(project.created_at).toLocaleDateString()}
        </p>

        {/* Status badge */}
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
          style={dmSans}
        >
          {statusCfg.label}
        </span>

        {/* Spacer */}
        <div className="h-8" />

        {/* Launch button */}
        <button
          onClick={() =>
            router.push(`/app/impact-studio/projects/${project.id}/live`)
          }
          className="px-8 py-4 bg-[#E9C03A] text-[#1B2B3A] rounded-xl text-base font-medium hover:brightness-105 transition-all"
          style={dmSans}
        >
          Launch {displayLabel} →
        </button>

        {/* Divider */}
        <hr className="my-8 border-[#1B2B3A]/10" />

        {/* View History */}
        <p
          className="text-[11px] font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
          style={dmSans}
        >
          View History
        </p>

        {runs.length === 0 ? (
          <p className="text-xs text-[#1B2B3A]/25" style={dmSans}>
            No views yet.
          </p>
        ) : (
          <div className="space-y-1 mb-6">
            {runs.map((run) => {
              const isActive = run.id === activeRunId;
              return (
                <button
                  key={run.id}
                  onClick={() => handleRunClick(run.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-[13px] flex items-center gap-2 ${
                    isActive
                      ? "bg-[#E9C03A]/10 border-l-2 border-[#E9C03A]"
                      : "hover:bg-[#1B2B3A]/5"
                  }`}
                  style={dmSans}
                >
                  <span className="text-[#1B2B3A]">
                    View {run.version_number}
                  </span>
                  <span className="text-[#1B2B3A]/30 ml-auto text-xs">
                    {timeAgo(run.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* New View button */}
        <button
          onClick={() =>
            router.push(
              `/app/impact-studio/projects/${project.id}?mode=generator`
            )
          }
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E9C03A] text-[#1B2B3A] rounded-lg text-sm font-medium hover:brightness-105 transition-all"
          style={dmSans}
        >
          <Plus className="w-4 h-4" />
          New View
        </button>

        <div className="h-12" />
      </div>
    </div>
  );
}
