"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Download, Plus } from "lucide-react";
import NewProjectModal from "@/components/impact-studio/NewProjectModal";

interface Run {
  id: string;
  version_number: number;
  is_latest: boolean;
  created_at: string;
}

interface ProjectDetailMode1Props {
  project: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    created_at: string;
  };
  runs: Run[];
  initialHtml: string | null;
}

const VIEW_TYPE_LABELS: Record<string, string> = {
  funder_format: "Document View",
  funder_report: "Funder Report",
  board_deck: "Board Deck",
  grant_narrative: "Grant Narrative",
  output_generator: "Output Generator",
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

export default function ProjectDetailMode1({
  project,
  runs,
  initialHtml,
}: ProjectDetailMode1Props) {
  const router = useRouter();
  const [selectedHtml, setSelectedHtml] = useState<string | null>(initialHtml);
  const [activeRunId, setActiveRunId] = useState<string | null>(
    runs[0]?.id ?? null
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);

  const statusCfg = STATUS_LABELS[project.status] ?? STATUS_LABELS.in_progress;

  async function handleRunClick(runId: string) {
    setActiveRunId(runId);
    try {
      const supabase = createClient();
      const { data: view } = await supabase
        .from("generated_views")
        .select("output_html")
        .eq("run_id", runId)
        .limit(1)
        .single();

      setSelectedHtml(view?.output_html ?? null);
    } catch (err) {
      console.error("Failed to fetch run output:", err);
    }
  }

  function handleExport() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
  const cormorant = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  } as const;

  return (
    <div className="min-h-screen bg-[#EDE8DE]">
      {/* Header */}
      <div className="bg-[#1B2B3A] px-6 py-3">
        <button
          onClick={() => router.push("/app/impact-studio")}
          className="flex items-center gap-1 text-sm text-[#EDE8DE]/70 hover:text-[#EDE8DE] transition-colors"
          style={dmSans}
        >
          <ChevronLeft className="w-4 h-4" />
          Projects
        </button>
      </div>

      {/* Two-column body */}
      <div className="flex gap-0 min-h-[calc(100vh-52px)]">
        {/* LEFT — iframe */}
        <div className="flex-1 p-6">
          {selectedHtml ? (
            <iframe
              srcDoc={selectedHtml}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full min-h-[600px] rounded-lg border border-[#1B2B3A]/20 bg-white"
              title="Generated output"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-white/50 rounded-lg border border-[#1B2B3A]/10">
              <p className="text-sm text-[#1B2B3A]/30" style={dmSans}>
                No output generated yet. Start a new run to see results here.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — sidebar */}
        <div className="w-72 flex-shrink-0 px-4 py-6 border-l border-[#1B2B3A]/10">
          {/* Project name */}
          <h1
            className="text-[22px] font-semibold text-[#1B2B3A] leading-tight mb-2"
            style={cormorant}
          >
            {project.name}
          </h1>

          {/* Metadata */}
          <p className="text-[13px] text-[#1B2B3A]/50 mb-2" style={dmSans}>
            {VIEW_TYPE_LABELS[project.project_type] ?? project.project_type} ·{" "}
            {new Date(project.created_at).toLocaleDateString()}
          </p>

          {/* Status badge */}
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
            style={dmSans}
          >
            {statusCfg.label}
          </span>

          <hr className="my-4 border-[#1B2B3A]/10" />

          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#1B2B3A]/15 rounded-lg text-sm text-[#1B2B3A]/60 hover:bg-[#1B2B3A]/5 transition-colors mb-2"
            style={dmSans}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* New Run button */}
          <button
            onClick={() => setShowNewRunModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#E9C03A] text-[#1B2B3A] rounded-lg text-sm font-medium hover:brightness-105 transition-all"
            style={dmSans}
          >
            <Plus className="w-4 h-4" />
            New Run
          </button>

          <hr className="my-4 border-[#1B2B3A]/10" />

          {/* Run History */}
          <p
            className="text-[11px] font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
            style={dmSans}
          >
            Run History
          </p>

          {runs.length === 0 ? (
            <p className="text-xs text-[#1B2B3A]/25" style={dmSans}>
              No runs yet.
            </p>
          ) : (
            <div className="space-y-1">
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
                      Run {run.version_number}
                    </span>
                    <span className="text-[#1B2B3A]/30 ml-auto text-xs">
                      {timeAgo(run.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1B2B3A] text-[#EDE8DE] px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          Export coming soon
        </div>
      )}

      {/* New Run Modal */}
      {showNewRunModal && (
        <NewProjectModal
          onClose={() => setShowNewRunModal(false)}
          onCreated={() => {
            // Navigation happens inside the modal after generation
          }}
          existingProjectId={project.id}
          existingProjectName={project.name}
          existingRunCount={runs.length}
        />
      )}
    </div>
  );
}
