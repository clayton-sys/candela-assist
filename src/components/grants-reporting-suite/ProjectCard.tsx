"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, Eye, Plus } from "lucide-react";

interface ProjectRun {
  id: string;
  version_number: number;
  period_label: string | null;
  created_at: string;
  is_latest: boolean;
  view_count: number;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  runs: ProjectRun[];
}

interface ProjectCardProps {
  project: Project;
  onOpenRun: (projectId: string, runId: string) => void;
  onAddPeriod: (projectId: string) => void;
}

export default function ProjectCard({ project, onOpenRun, onAddPeriod }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const latestRun = project.runs.find((r) => r.is_latest) ?? project.runs[0];
  const olderRuns = project.runs.filter((r) => r !== latestRun);

  return (
    <div className="bg-white rounded-xl border border-midnight/5 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold text-midnight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {project.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-midnight/40" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {latestRun && (
              <>
                <span>v{latestRun.version_number}</span>
                {latestRun.period_label && (
                  <span>{latestRun.period_label}</span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {latestRun.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {latestRun && (
            <button
              onClick={() => onOpenRun(project.id, latestRun.id)}
              className="px-3 py-1.5 bg-cerulean text-white rounded-lg text-xs font-medium hover:bg-cerulean-dark transition-colors"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Open Latest
            </button>
          )}
          <button
            onClick={() => onAddPeriod(project.id)}
            className="px-3 py-1.5 border border-midnight/10 text-midnight/60 rounded-lg text-xs font-medium hover:bg-midnight/5 transition-colors"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            New Period
          </button>
          {olderRuns.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-midnight/30 hover:text-midnight/60 transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && olderRuns.length > 0 && (
        <div className="border-t border-midnight/5 bg-stone/30">
          {olderRuns.map((run) => (
            <button
              key={run.id}
              onClick={() => onOpenRun(project.id, run.id)}
              className="w-full px-6 py-2.5 flex items-center justify-between text-xs text-midnight/50 hover:bg-white/50 transition-colors"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <span>
                v{run.version_number}
                {run.period_label ? ` — ${run.period_label}` : ""}
              </span>
              <span className="flex items-center gap-3">
                <span>{run.view_count} views</span>
                <span>{new Date(run.created_at).toLocaleDateString()}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
