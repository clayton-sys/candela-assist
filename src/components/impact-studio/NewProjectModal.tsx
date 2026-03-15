"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Plus,
  Loader2,
  ChevronLeft,
  Database,
  Palette,
  Lock,
} from "lucide-react";
import ThemePicker from "./ThemePicker";

interface Program {
  id: string;
  name: string;
}

interface DataEntry {
  id: string;
  period_label: string | null;
  program: { id: string; name: string } | null;
  created_at: string;
}

interface BrandKit {
  brand_primary: string;
  brand_accent: string;
  brand_success: string;
  brand_text: string;
  logo_url: string | null;
}

// Granular view types
type DocumentViewType = "funder_report" | "board_deck" | "grant_narrative";
type InteractiveViewType =
  | "impact_command_center"
  | "impact_journey"
  | "staff_dashboard"
  | "orbit_view";
type SelectedViewType = DocumentViewType | InteractiveViewType;
type SelectedMode = "narrative" | "interactive";

// Map view types to DB project_type values
const VIEW_TYPE_TO_PROJECT_TYPE: Record<SelectedMode, string> = {
  narrative: "funder_format",
  interactive: "output_generator",
};

const DOCUMENT_VIEWS: {
  type: DocumentViewType;
  name: string;
  description: string;
}[] = [
  {
    type: "funder_report",
    name: "Funder Report",
    description: "Comprehensive narrative report tailored for funders",
  },
  {
    type: "board_deck",
    name: "Board Deck",
    description: "Presentation-ready slides for board meetings",
  },
  {
    type: "grant_narrative",
    name: "Grant Narrative",
    description: "Structured narrative for grant applications",
  },
];

const INTERACTIVE_VIEWS: {
  type: InteractiveViewType;
  name: string;
  description: string;
  locked?: boolean;
}[] = [
  {
    type: "impact_command_center",
    name: "Impact Command Center",
    description: "Interactive dashboard with drillable metric nodes",
  },
  {
    type: "impact_journey",
    name: "Impact Journey",
    description: "Visual narrative of your organization's impact over time",
  },
  {
    type: "staff_dashboard",
    name: "Staff Dashboard",
    description: "Operational KPIs and progress tracking for staff",
  },
  {
    type: "orbit_view",
    name: "Orbit View",
    description: "Radial visualization of interconnected outcomes",
    locked: true,
  },
];

// Map wizard view types to the API's view type keys
const WIZARD_TO_API_VIEW: Record<string, string> = {
  funder_report: "funder_public",
  board_deck: "board_deck",
  grant_narrative: "funder_public",
  impact_command_center: "command_center",
  impact_journey: "command_center",
  staff_dashboard: "staff_dashboard",
  orbit_view: "command_center",
};

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
  existingProjectId?: string;
  existingProjectName?: string;
  existingRunCount?: number;
}

export default function NewProjectModal({
  onClose,
  onCreated,
  existingProjectId,
  existingProjectName,
  existingRunCount,
}: NewProjectModalProps) {
  const isNewRun = !!existingProjectId;
  const router = useRouter();

  // Step 1 fields
  const [projectName, setProjectName] = useState("");
  const [funderName, setFunderName] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [programId, setProgramId] = useState<string | null>(null);
  const [newProgramName, setNewProgramName] = useState("");
  const [showNewProgramInput, setShowNewProgramInput] = useState(false);

  // Programs
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 2 fields — view type picker
  const [selectedViewType, setSelectedViewType] =
    useState<SelectedViewType | null>(null);
  const [selectedMode, setSelectedMode] = useState<SelectedMode | null>(null);

  // Step 3 fields — theme picker (narrative only)
  const [selectedThemeId, setSelectedThemeId] = useState("candela-classic");
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [orgPlan, setOrgPlan] = useState("starter");

  // Data step fields
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDataIds, setSelectedDataIds] = useState<string[]>([]);

  // Submission
  const [creating, setCreating] = useState(false);

  // Dynamic step calculation
  const isNarrative = selectedMode === "narrative";
  const totalSteps = isNarrative ? 4 : 3;

  // Current step: 1=Details, 2=ViewType, 3=Style(narrative)/Data(interactive), 4=Data(narrative)
  const [step, setStep] = useState(isNewRun ? 2 : 1);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // The data step number depends on path
  const dataStep = isNarrative ? 4 : 3;
  const themeStep = 3; // Only used when narrative

  function getStepLabel(s: number): string {
    if (s === 1) return "Project Details";
    if (s === 2) return "View Type";
    if (isNarrative) {
      if (s === 3) return "Style";
      if (s === 4) return "Choose Data";
    }
    return "Choose Data";
  }

  const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
  const cormorant = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  } as const;

  // Load programs on mount
  useEffect(() => {
    async function loadPrograms() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: orgUser } = await supabase
          .from("org_users")
          .select("org_id")
          .eq("user_id", user.id)
          .single();

        if (!orgUser) return;
        setOrgId(orgUser.org_id);

        const { data: progs } = await supabase
          .from("programs")
          .select("id, name")
          .eq("org_id", orgUser.org_id)
          .order("name");

        if (progs && progs.length > 0) {
          setPrograms(progs);
        } else {
          setShowNewProgramInput(true);
        }
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    }
    loadPrograms();
  }, []);

  // Fetch brand kit when entering Step 2
  useEffect(() => {
    if (step !== 2 || !orgId) return;

    async function loadBrandKit() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("brand_kits")
          .select(
            "brand_primary, brand_accent, brand_success, brand_text, logo_url"
          )
          .eq("org_id", orgId!)
          .single();

        if (data) {
          setBrandKit(data as BrandKit);
        }
      } catch (err) {
        console.error("Failed to load brand kit:", err);
      }
    }

    async function loadOrgPlan() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("orgs")
          .select("plan")
          .eq("id", orgId!)
          .single();
        if (data?.plan) setOrgPlan(data.plan);
      } catch {
        // Default to starter
      }
    }

    loadBrandKit();
    loadOrgPlan();
  }, [step, orgId]);

  // Load data entries when entering data step
  useEffect(() => {
    if (step !== dataStep || !orgId) return;

    async function loadDataEntries() {
      setLoadingData(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("program_data")
          .select("id, period_label, created_at, program:programs(id, name)")
          .eq("org_id", orgId!);

        const scopeProgramId =
          showNewProgramInput || programId === "org-wide" ? null : programId;
        if (scopeProgramId) {
          query = query.eq("program_id", scopeProgramId);
        }

        const { data } = await query.order("created_at", {
          ascending: false,
        });
        setDataEntries((data as unknown as DataEntry[]) ?? []);
      } catch (err) {
        console.error("Failed to load data entries:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadDataEntries();
  }, [step, dataStep, orgId, programId, showNewProgramInput]);

  const scopeProgramId = showNewProgramInput ? null : programId;

  function canProceedToStep2(): boolean {
    if (!projectName.trim()) return false;
    if (!scopeProgramId && !showNewProgramInput) return false;
    if (showNewProgramInput && !newProgramName.trim()) return false;
    return true;
  }

  function canProceedFromStep2(): boolean {
    return selectedViewType !== null && selectedMode !== null;
  }

  function handleNextFromStep2() {
    if (!canProceedFromStep2()) return;
    if (selectedMode === "narrative") {
      setStep(3); // Go to theme picker
    } else {
      setStep(3); // Go to data step (which IS step 3 for interactive)
    }
  }

  function handleBackFromDataStep() {
    if (isNarrative) {
      setStep(themeStep); // Back to theme picker
    } else {
      setStep(2); // Back to view type
    }
  }

  function toggleDataSelection(id: string) {
    setSelectedDataIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function selectViewType(
    viewType: SelectedViewType,
    mode: SelectedMode
  ) {
    setSelectedViewType(viewType);
    setSelectedMode(mode);
  }

  async function handleCreate() {
    console.log("[NewProjectModal] handleCreate fired", {
      projectName,
      selectedViewType,
      selectedMode,
      selectedThemeId,
      programId,
      orgId,
      userId,
      selectedDataIds,
      isNewRun,
      existingProjectId,
    });
    if (creating) return;
    setCreating(true);
    setGenerating(false);
    setGenerateError(null);

    try {
      const supabase = createClient();
      if (!orgId || !userId) {
        console.error("New Project modal: missing orgId or userId", {
          orgId,
          userId,
        });
        setCreating(false);
        return;
      }

      let projectId: string;

      if (isNewRun && existingProjectId) {
        // New run on existing project — skip project creation
        projectId = existingProjectId;

        // Clear is_latest on previous runs
        await supabase
          .from("project_runs")
          .update({ is_latest: false })
          .eq("project_id", projectId);
      } else {
        // Create program if needed
        let finalProgramId = programId === "org-wide" ? null : programId;

        if (showNewProgramInput && newProgramName.trim()) {
          const { data: newProgram, error: progError } = await supabase
            .from("programs")
            .insert({
              org_id: orgId,
              name: newProgramName.trim(),
            })
            .select("id")
            .single();

          if (progError) {
            console.error("Failed to create program:", progError);
          }
          if (newProgram) {
            finalProgramId = newProgram.id;
          }
        }

        // Create project
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
            org_id: orgId,
            name: projectName.trim(),
            program_id: finalProgramId,
            project_type: VIEW_TYPE_TO_PROJECT_TYPE[selectedMode!],
            status: "in_progress",
            created_by: userId,
          })
          .select("id")
          .single();

        if (projectError || !project) {
          console.error("Failed to create project:", projectError);
          setCreating(false);
          return;
        }

        projectId = project.id;
      }

      // Create project_run
      const versionNumber = isNewRun ? (existingRunCount ?? 0) + 1 : 1;
      const { data: run, error: runError } = await supabase
        .from("project_runs")
        .insert({
          project_id: projectId,
          version_number: versionNumber,
          is_latest: true,
          period_label: periodLabel.trim() || null,
          selected_data_points: selectedDataIds,
          theme_id: selectedThemeId,
        })
        .select("id")
        .single();

      if (runError || !run) {
        console.error("Failed to create project run:", runError);
        setCreating(false);
        return;
      }

      // --- Generation: fetch data, call API, save output ---
      setGenerating(true);

      // Fetch selected program_data rows
      const { data: dataRows } = await supabase
        .from("program_data")
        .select(
          "id, period_label, outcomes, quantitative_data, barriers, client_voice, change_description"
        )
        .in("id", selectedDataIds.length > 0 ? selectedDataIds : ["__none__"]);

      // Transform program_data fields into DataPoint[] for the API
      const dataPoints: {
        id: string;
        label: string;
        value: string;
        category: string;
      }[] = [];
      for (const row of dataRows ?? []) {
        const prefix = row.period_label || "Entry";
        if (row.outcomes)
          dataPoints.push({
            id: `${row.id}-outcomes`,
            label: `${prefix} — Outcomes`,
            value: row.outcomes,
            category: "outcomes",
          });
        if (row.quantitative_data)
          dataPoints.push({
            id: `${row.id}-quant`,
            label: `${prefix} — Quantitative Data`,
            value: row.quantitative_data,
            category: "volume",
          });
        if (row.barriers)
          dataPoints.push({
            id: `${row.id}-barriers`,
            label: `${prefix} — Barriers`,
            value: row.barriers,
            category: "outcomes",
          });
        if (row.client_voice)
          dataPoints.push({
            id: `${row.id}-voice`,
            label: `${prefix} — Client Voice`,
            value: row.client_voice,
            category: "outcomes",
          });
        if (row.change_description)
          dataPoints.push({
            id: `${row.id}-change`,
            label: `${prefix} — Change Description`,
            value: row.change_description,
            category: "outcomes",
          });
      }

      // Map wizard view type to API view type
      const apiViewType =
        WIZARD_TO_API_VIEW[selectedViewType ?? ""] ?? "funder_public";

      // Call generate API
      const res = await fetch("/api/impact/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataPoints,
          selectedViews: [apiViewType],
          theme: selectedThemeId,
          layout: "constellation",
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Generation API error:", errBody);
        setGenerateError(
          errBody.error ?? "Generation failed. Please try again."
        );
        setGenerating(false);
        setCreating(false);
        return;
      }

      const genData = await res.json();
      const outputHtml =
        genData.outputs?.[apiViewType] ?? Object.values(genData.outputs ?? {})[0] ?? null;

      if (outputHtml) {
        // Save to generated_views
        const { error: viewError } = await supabase
          .from("generated_views")
          .insert({
            run_id: run.id,
            view_type: selectedViewType ?? apiViewType,
            output_html: outputHtml,
          });

        if (viewError) {
          console.error("Failed to save generated view:", viewError);
        }
      }

      console.log(
        "[NewProjectModal] Project + generation complete:",
        projectId
      );
      onCreated();
      onClose();
      router.push(`/app/impact-studio/projects/${projectId}`);
    } catch (err) {
      console.error("Error creating project:", err);
      setGenerateError("An unexpected error occurred.");
      setCreating(false);
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2B3A]/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2
              className="text-xl font-semibold text-[#1B2B3A]"
              style={cormorant}
            >
              {isNewRun ? "New Run" : "New Project"}
            </h2>
            <p
              className="text-xs text-[#1B2B3A]/40 mt-0.5"
              style={dmSans}
            >
              {isNewRun
                ? `Step ${step - 1} of ${totalSteps - 1}`
                : `Step ${step} of ${totalSteps}`}{" "}
              &mdash; {getStepLabel(step)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#1B2B3A]/30 hover:text-[#1B2B3A]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex gap-2">
            {Array.from({
              length: isNewRun ? totalSteps - 1 : totalSteps,
            }).map((_, i) => {
              const stepNum = isNewRun ? i + 2 : i + 1;
              return (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step >= stepNum ? "bg-[#3A6B8A]" : "bg-[#1B2B3A]/10"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* ===== STEP 1: Project Details ===== */}
          {step === 1 && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label
                    className="block text-xs font-medium text-[#1B2B3A]/60 mb-1.5"
                    style={dmSans}
                  >
                    Project Name <span className="text-[#D85A30]">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Youth Mentorship Q1 Report"
                    className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/25 focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                    style={dmSans}
                    autoFocus
                  />
                </div>

                {/* Funder Name */}
                <div>
                  <label
                    className="block text-xs font-medium text-[#1B2B3A]/60 mb-1.5"
                    style={dmSans}
                  >
                    Funder Name{" "}
                    <span className="text-[#1B2B3A]/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={funderName}
                    onChange={(e) => setFunderName(e.target.value)}
                    placeholder="e.g. Colorado Health Foundation"
                    className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/25 focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                    style={dmSans}
                  />
                </div>

                {/* Period Label */}
                <div>
                  <label
                    className="block text-xs font-medium text-[#1B2B3A]/60 mb-1.5"
                    style={dmSans}
                  >
                    Reporting Period{" "}
                    <span className="text-[#1B2B3A]/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                    placeholder="e.g. Q1 2026"
                    className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/25 focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                    style={dmSans}
                  />
                </div>

                {/* Program Scope */}
                <div>
                  <label
                    className="block text-xs font-medium text-[#1B2B3A]/60 mb-1.5"
                    style={dmSans}
                  >
                    Program Scope <span className="text-[#D85A30]">*</span>
                  </label>
                  {loadingPrograms ? (
                    <div className="flex items-center gap-2 text-xs text-[#1B2B3A]/30 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading programs...
                    </div>
                  ) : programs.length > 0 && !showNewProgramInput ? (
                    <div className="space-y-2">
                      <select
                        value={programId ?? ""}
                        onChange={(e) => setProgramId(e.target.value || null)}
                        className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                        style={dmSans}
                      >
                        <option value="">Select a program</option>
                        <option value="org-wide">Org-wide</option>
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewProgramInput(true);
                          setProgramId(null);
                        }}
                        className="text-xs text-[#3A6B8A] hover:text-[#2A5570] transition-colors flex items-center gap-1"
                        style={dmSans}
                      >
                        <Plus className="w-3 h-3" />
                        Add new program
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {programs.length === 0 ? (
                        <p
                          className="text-xs text-[#1B2B3A]/40 mb-1"
                          style={dmSans}
                        >
                          Add your first program
                        </p>
                      ) : null}
                      <input
                        type="text"
                        value={newProgramName}
                        onChange={(e) => setNewProgramName(e.target.value)}
                        placeholder="Program name"
                        className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/25 focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                        style={dmSans}
                      />
                      {programs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewProgramInput(false);
                            setNewProgramName("");
                          }}
                          className="text-xs text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors"
                          style={dmSans}
                        >
                          Choose existing program instead
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 1 footer */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-[#1B2B3A]/50 hover:text-[#1B2B3A]/70 transition-colors"
                  style={dmSans}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2()}
                  className="px-5 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={dmSans}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: View Type Picker ===== */}
          {step === 2 && (
            <div className="px-6 pb-6">
              <p className="text-sm text-[#1B2B3A]/60 mb-5" style={dmSans}>
                What type of output are you creating?
              </p>

              {/* GROUP 1 — Document Views */}
              <div className="mb-6">
                <h3
                  className="text-xs font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
                  style={dmSans}
                >
                  Document Views
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {DOCUMENT_VIEWS.map((view) => {
                    const isSelected = selectedViewType === view.type;
                    return (
                      <button
                        key={view.type}
                        onClick={() =>
                          selectViewType(view.type, "narrative")
                        }
                        className={`relative text-left p-4 border-2 rounded-xl transition-all ${
                          isSelected
                            ? "border-[#E9C03A] bg-[#E9C03A]/5 ring-2 ring-[#E9C03A]/20"
                            : "border-[#1B2B3A]/10 hover:border-[#3A6B8A] hover:bg-[#3A6B8A]/5"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4
                              className="text-base font-medium text-[#1B2B3A]"
                              style={cormorant}
                            >
                              {view.name}
                            </h4>
                            <p
                              className="text-xs text-[#1B2B3A]/50 mt-0.5"
                              style={dmSans}
                            >
                              {view.description}
                            </p>
                          </div>
                          <Palette className="w-4 h-4 text-[#1B2B3A]/20 flex-shrink-0 mt-1 ml-2" />
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E9C03A] flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GROUP 2 — Interactive Views */}
              <div>
                <h3
                  className="text-xs font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
                  style={dmSans}
                >
                  Interactive Views
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {INTERACTIVE_VIEWS.map((view) => {
                    const isSelected = selectedViewType === view.type;
                    const isLocked = view.locked === true;
                    return (
                      <button
                        key={view.type}
                        onClick={
                          isLocked
                            ? undefined
                            : () =>
                                selectViewType(view.type, "interactive")
                        }
                        disabled={isLocked}
                        className={`relative text-left p-4 border-2 rounded-xl transition-all ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed border-[#1B2B3A]/10"
                            : isSelected
                            ? "border-[#E9C03A] bg-[#E9C03A]/5 ring-2 ring-[#E9C03A]/20"
                            : "border-[#1B2B3A]/10 hover:border-[#3A6B8A] hover:bg-[#3A6B8A]/5"
                        }`}
                        style={isLocked ? { pointerEvents: "none" } : undefined}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className="text-base font-medium text-[#1B2B3A]"
                              style={cormorant}
                            >
                              {view.name}
                            </h4>
                            {isLocked && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1B2B3A]/10 text-[#1B2B3A]/50 rounded-full text-[10px] font-medium"
                                style={dmSans}
                              >
                                <Lock className="w-2.5 h-2.5" />
                                Pro
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs text-[#1B2B3A]/50 mt-0.5"
                            style={dmSans}
                          >
                            {view.description}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{
                              ...dmSans,
                              color: "rgba(27, 43, 58, 0.45)",
                            }}
                          >
                            AI-generated · Uses your Brand Kit colors
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E9C03A] flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 footer */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors"
                  style={dmSans}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  disabled={!canProceedFromStep2()}
                  className="px-5 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={dmSans}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3 (Narrative): Theme Picker ===== */}
          {step === 3 && isNarrative && (
            <div className="px-6 pb-6">
              <p className="text-sm text-[#1B2B3A]/60 mb-5" style={dmSans}>
                Choose a visual style for your document
              </p>

              <ThemePicker
                selectedThemeId={selectedThemeId}
                orgPlan={orgPlan}
                brandKit={brandKit}
                onSelect={setSelectedThemeId}
              />

              {/* Step 3 theme footer */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-sm text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors"
                  style={dmSans}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors"
                  style={dmSans}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ===== DATA STEP (Step 3 for interactive, Step 4 for narrative) ===== */}
          {step === dataStep && !(step === 3 && isNarrative) && (
            <div className="px-6 pb-6">
              <p className="text-sm text-[#1B2B3A]/60 mb-1" style={dmSans}>
                Select data from your workspace library
              </p>
              <p className="text-xs text-[#1B2B3A]/30 mb-4" style={dmSans}>
                {scopeProgramId
                  ? `Filtered to: ${programs.find((p) => p.id === scopeProgramId)?.name ?? "selected program"}`
                  : newProgramName.trim()
                  ? `New program: ${newProgramName.trim()}`
                  : "All programs"}
              </p>

              {/* Data entries list */}
              <div className="border border-[#1B2B3A]/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {loadingData ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#1B2B3A]/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading data...
                  </div>
                ) : dataEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <Database className="w-8 h-8 text-[#1B2B3A]/15 mb-3" />
                    <p
                      className="text-sm font-medium text-[#1B2B3A]/40 mb-1"
                      style={dmSans}
                    >
                      No data available
                    </p>
                    <p
                      className="text-xs text-[#1B2B3A]/25 text-center"
                      style={dmSans}
                    >
                      Add data entries in the workspace Data area to use them in
                      projects.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1B2B3A]/5">
                    {dataEntries.map((entry) => {
                      const isSelected = selectedDataIds.includes(entry.id);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => toggleDataSelection(entry.id)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            isSelected
                              ? "bg-[#3A6B8A]/5"
                              : "hover:bg-[#1B2B3A]/[0.02]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "border-[#3A6B8A] bg-[#3A6B8A]"
                                : "border-[#1B2B3A]/20"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm text-[#1B2B3A] truncate"
                              style={dmSans}
                            >
                              {entry.period_label ??
                                `Entry from ${new Date(entry.created_at).toLocaleDateString()}`}
                            </p>
                            {entry.program && (
                              <p
                                className="text-xs text-[#1B2B3A]/40 truncate"
                                style={dmSans}
                              >
                                {entry.program.name}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generation error */}
              {generateError && (
                <div
                  className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700"
                  style={dmSans}
                >
                  {generateError}
                </div>
              )}

              {/* Data step footer */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBackFromDataStep}
                  disabled={creating}
                  className="flex items-center gap-1 text-sm text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors disabled:opacity-40"
                  style={dmSans}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-5 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  style={dmSans}
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {generating
                    ? "Generating..."
                    : creating
                    ? "Creating..."
                    : isNewRun
                    ? "Generate New Run"
                    : "Create & Generate"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
