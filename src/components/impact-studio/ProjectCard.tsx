"use client";

import { Eye, Clock, User } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  org_id: string;
  program_id: string | null;
  program_name: string | null;
  funder_name: string | null;
  project_type: string;
  status: "in_progress" | "waiting" | "ready" | "complete";
  blocking_message: string | null;
  period_label: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
}

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onViewStripClick: (project: Project) => void;
  variant: "grid" | "list";
}

const STATUS_CONFIG: Record<
  Project["status"],
  { color: string; dotColor: string; label: string }
> = {
  in_progress: {
    color: "text-[#3A6B8A]",
    dotColor: "bg-[#3A6B8A]",
    label: "In Progress",
  },
  waiting: {
    color: "text-[#BA7517]",
    dotColor: "bg-[#BA7517]",
    label: "Waiting",
  },
  ready: {
    color: "text-[#1D9E75]",
    dotColor: "bg-[#1D9E75]",
    label: "Ready to Generate",
  },
  complete: {
    color: "text-[#E9C03A]",
    dotColor: "bg-[#E9C03A]",
    label: "Complete",
  },
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

export default function ProjectCard({
  project,
  onClick,
  onViewStripClick,
  variant,
}: ProjectCardProps) {
  const statusCfg = STATUS_CONFIG[project.status];

  if (variant === "list") {
    return (
      <div
        onClick={() => onClick(project)}
        className="bg-white rounded-lg border border-[#1B2B3A]/5 p-4 flex items-center gap-4 cursor-pointer hover:border-[#3A6B8A]/20 hover:shadow-sm transition-all"
      >
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dotColor} shrink-0`} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold text-[#1B2B3A] truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {project.name}
          </h3>
        </div>

        {/* Funder */}
        <span
          className="text-xs text-[#1B2B3A]/50 truncate max-w-[120px]"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {project.funder_name || "Internal"}
        </span>

        {/* Type badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            (project.project_type === "impact_command_center" || project.project_type === "story_view")
              ? "bg-[#3A6B8A]/10 text-[#3A6B8A]"
              : "bg-[#E9C03A]/15 text-[#BA7517]"
          }`}
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {(project.project_type === "impact_command_center" || project.project_type === "story_view")
            ? "Interactive"
            : "Document"}
        </span>

        {/* Period */}
        {project.period_label && (
          <span
            className="text-xs text-[#1B2B3A]/40 shrink-0"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {project.period_label}
          </span>
        )}

        {/* Status */}
        <span
          className={`text-xs ${statusCfg.color} shrink-0`}
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {statusCfg.label}
        </span>

        {/* Views */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewStripClick(project);
          }}
          className="text-xs text-[#1B2B3A]/40 hover:text-[#3A6B8A] transition-colors shrink-0 flex items-center gap-1"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          <Eye className="w-3 h-3" />
          {project.view_count}
        </button>

        {/* Last touched */}
        <span
          className="text-xs text-[#1B2B3A]/30 shrink-0"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {timeAgo(project.updated_at)}
        </span>
      </div>
    );
  }

  // Grid variant (card)
  return (
    <div
      onClick={() => onClick(project)}
      className="bg-white rounded-xl border border-[#1B2B3A]/5 overflow-hidden cursor-pointer hover:border-[#3A6B8A]/20 hover:shadow-md transition-all group flex flex-col"
    >
      {/* Card body */}
      <div className="p-5 flex-1">
        {/* Top row: type badge + status */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
              (project.project_type === "impact_command_center" || project.project_type === "story_view")
                ? "bg-[#3A6B8A]/10 text-[#3A6B8A]"
                : "bg-[#E9C03A]/15 text-[#BA7517]"
            }`}
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {(project.project_type === "impact_command_center" || project.project_type === "story_view")
              ? "Interactive"
              : "Document"}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${statusCfg.dotColor}`}
            />
            <span
              className={`text-xs ${statusCfg.color}`}
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Project name */}
        <h3
          className="text-lg font-semibold text-[#1B2B3A] leading-tight mb-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {project.name}
        </h3>

        {/* Funder */}
        <p
          className="text-sm text-[#1B2B3A]/50 mb-3"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {project.funder_name || (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#1B2B3A]/5 rounded text-[10px] text-[#1B2B3A]/40 uppercase tracking-wider">
              Internal
            </span>
          )}
        </p>

        {/* Period label */}
        {project.period_label && (
          <p
            className="text-xs text-[#1B2B3A]/40 mb-3"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {project.period_label}
          </p>
        )}

        {/* Blocking message */}
        {project.blocking_message && (
          <p
            className="text-xs text-[#BA7517] bg-[#BA7517]/5 rounded-lg px-3 py-2 mb-3"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {project.blocking_message}
          </p>
        )}

        {/* Meta: last touched + creator */}
        <div
          className="flex items-center gap-3 text-[11px] text-[#1B2B3A]/30"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(project.updated_at)}
          </span>
          {project.created_by_name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Started by {project.created_by_name}
            </span>
          )}
        </div>
      </div>

      {/* View count strip */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewStripClick(project);
        }}
        className="w-full px-5 py-2.5 bg-[#EDE8DE]/40 border-t border-[#1B2B3A]/5 flex items-center gap-1.5 text-xs text-[#1B2B3A]/40 hover:text-[#3A6B8A] hover:bg-[#EDE8DE]/70 transition-colors"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <Eye className="w-3.5 h-3.5" />
        {project.view_count} view{project.view_count !== 1 ? "s" : ""} generated
      </button>
    </div>
  );
}
