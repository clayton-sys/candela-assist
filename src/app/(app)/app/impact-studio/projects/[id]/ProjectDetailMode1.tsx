"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus } from "lucide-react";
import NewProjectModal from "@/components/impact-studio/NewProjectModal";
import EditableViewFrame from "@/components/impact-studio/EditableViewFrame";
import ExportDropdown from "@/components/impact-studio/ExportDropdown";

interface Run {
  id: string;
  version_number: number;
  is_latest: boolean;
  created_at: string;
  view_type: string | null;
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
  initialContentMap: Record<string, string> | null;
  initialViewId: string | null;
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

function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildViewLabels(runs: Run[]): Map<string, string> {
  const labels = new Map<string, string>();
  // Runs arrive newest-first; count per view_type oldest-first
  const reversed = [...runs].reverse();
  const counters: Record<string, number> = {};
  for (const run of reversed) {
    const vt = run.view_type ?? "view";
    counters[vt] = (counters[vt] ?? 0) + 1;
    const displayType = VIEW_TYPE_LABELS[vt] ?? toTitleCase(vt);
    labels.set(run.id, `View ${displayType} ${counters[vt]}`);
  }
  return labels;
}

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
  initialContentMap,
  initialViewId,
}: ProjectDetailMode1Props) {
  const router = useRouter();
  const [selectedHtml, setSelectedHtml] = useState<string | null>(initialHtml);
  const [contentMap, setContentMap] = useState<Record<string, string> | null>(
    initialContentMap
  );
  const [currentViewId, setCurrentViewId] = useState<string | null>(initialViewId);
  const [activeRunId, setActiveRunId] = useState<string | null>(
    runs[0]?.id ?? null
  );
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const viewLabels = buildViewLabels(runs);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const statusCfg = STATUS_LABELS[project.status] ?? STATUS_LABELS.in_progress;

  async function handleRunClick(runId: string) {
    setActiveRunId(runId);
    try {
      const supabase = createClient();
      const { data: view } = await supabase
        .from("generated_views")
        .select("id, output_html, content_map")
        .eq("run_id", runId)
        .limit(1)
        .single();

      setSelectedHtml(view?.output_html ?? null);
      setContentMap((view?.content_map as Record<string, string>) ?? null);
      setCurrentViewId(view?.id ?? null);
    } catch (err) {
      console.error("Failed to fetch run output:", err);
    }
  }

  const handleEditSave = useCallback(
    async (newContentMap: Record<string, string>, updatedHtml: string) => {
      setContentMap(newContentMap);
      setSelectedHtml(updatedHtml);

      if (!currentViewId) return;

      try {
        const supabase = createClient();
        await supabase
          .from("generated_views")
          .update({
            content_map: newContentMap,
            output_html: updatedHtml,
          })
          .eq("id", currentViewId);

        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2000);
      } catch (err) {
        console.error("Failed to save edit:", err);
      }
    },
    [currentViewId]
  );

  // Provide iframe element to ExportDropdown
  const getIframeElement = useCallback((): HTMLIFrameElement | null => {
    // Find the iframe inside EditableViewFrame
    const container = document.querySelector('[data-view-frame]');
    return container?.querySelector("iframe") ?? null;
  }, []);

  const getHtml = useCallback(() => selectedHtml, [selectedHtml]);

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
        {/* LEFT — editable view frame */}
        <div className="flex-1 p-6" data-view-frame>
          {selectedHtml ? (
            <EditableViewFrame
              html={selectedHtml}
              contentMap={contentMap}
              onSave={handleEditSave}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-white/50 rounded-lg border border-[#1B2B3A]/10">
              <p className="text-sm text-[#1B2B3A]/30" style={dmSans}>
                No output generated yet. Start a new view to see results here.
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

          {/* Export dropdown */}
          <div className="mb-2">
            <ExportDropdown
              projectName={project.name}
              viewType={VIEW_TYPE_LABELS[project.project_type] ?? "view"}
              getHtml={getHtml}
              getIframeElement={getIframeElement}
            />
          </div>

          {/* New Run button */}
          <button
            onClick={() => setShowNewRunModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#E9C03A] text-[#1B2B3A] rounded-lg text-sm font-medium hover:brightness-105 transition-all"
            style={dmSans}
          >
            <Plus className="w-4 h-4" />
            Edit View
          </button>

          <hr className="my-4 border-[#1B2B3A]/10" />

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
                      {viewLabels.get(run.id) ?? `View ${run.version_number}`}
                    </span>
                    <span className="text-[#1B2B3A]/30 ml-auto text-xs">
                      {timeAgo(run.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Editing hint */}
          {selectedHtml && (
            <>
              <hr className="my-4 border-[#1B2B3A]/10" />
              <p className="text-[11px] text-[#1B2B3A]/30" style={dmSans}>
                Click any text block in the view to edit it inline.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          Edit saved
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
