"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  FileText,
  LayoutDashboard,
  Plus,
  Loader2,
  ChevronLeft,
  Database,
} from "lucide-react";

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

type ViewType = "narrative" | "interactive";

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function NewProjectModal({
  onClose,
  onCreated,
}: NewProjectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // Step 2 field
  const [viewType, setViewType] = useState<ViewType | null>(null);

  // Step 3 fields
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDataIds, setSelectedDataIds] = useState<string[]>([]);

  // Submission
  const [creating, setCreating] = useState(false);

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

  // Load data entries when entering Step 3
  useEffect(() => {
    if (step !== 3 || !orgId) return;

    async function loadDataEntries() {
      setLoadingData(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("program_data")
          .select("id, period_label, created_at, program:programs(id, name)")
          .eq("org_id", orgId!);

        // Filter by selected program scope
        const scopeProgramId = showNewProgramInput ? null : programId;
        if (scopeProgramId) {
          query = query.eq("program_id", scopeProgramId);
        }

        const { data } = await query.order("created_at", { ascending: false });
        setDataEntries((data as unknown as DataEntry[]) ?? []);
      } catch (err) {
        console.error("Failed to load data entries:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadDataEntries();
  }, [step, orgId, programId, showNewProgramInput]);

  // The effective program ID for scope (existing selection or null for new program)
  const scopeProgramId = showNewProgramInput ? null : programId;

  function canProceedToStep2(): boolean {
    if (!projectName.trim()) return false;
    // Program scope is required
    if (!scopeProgramId && !showNewProgramInput) return false;
    if (showNewProgramInput && !newProgramName.trim()) return false;
    return true;
  }

  function canProceedToStep3(): boolean {
    return viewType !== null;
  }

  function toggleDataSelection(id: string) {
    setSelectedDataIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);

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

      // Create program if needed
      let finalProgramId = programId;

      if (showNewProgramInput && newProgramName.trim()) {
        const { data: newProgram } = await supabase
          .from("programs")
          .insert({
            org_id: orgId,
            name: newProgramName.trim(),
          })
          .select("id")
          .single();

        if (newProgram) {
          finalProgramId = newProgram.id;
        }
      }

      // Create project
      const { data: project } = await supabase
        .from("projects")
        .insert({
          org_id: orgId,
          name: projectName.trim(),
          funder_name: funderName.trim() || null,
          program_id: finalProgramId,
          project_type: viewType,
          status: "in_progress",
          created_by: userId,
        })
        .select("id")
        .single();

      if (!project) {
        console.error("Failed to create project");
        setCreating(false);
        return;
      }

      // Create initial project_run
      const { data: run } = await supabase
        .from("project_runs")
        .insert({
          project_id: project.id,
          version_number: 1,
          is_latest: true,
          period_label: periodLabel.trim() || null,
          data_entry_id: selectedDataIds.length === 1 ? selectedDataIds[0] : null,
        })
        .select("id")
        .single();

      if (!run) {
        console.error("Failed to create project run");
        setCreating(false);
        return;
      }

      onCreated();
      onClose();
      router.push("/app/impact-studio/input");
    } catch (err) {
      console.error("Error creating project:", err);
      setCreating(false);
    }
  }

  const stepLabels = ["Project Details", "View Type", "Choose Data"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2B3A]/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2
              className="text-xl font-semibold text-[#1B2B3A]"
              style={cormorant}
            >
              New Project
            </h2>
            <p
              className="text-xs text-[#1B2B3A]/40 mt-0.5"
              style={dmSans}
            >
              Step {step} of 3 &mdash; {stepLabels[step - 1]}
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
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step >= s ? "bg-[#3A6B8A]" : "bg-[#1B2B3A]/10"
                }`}
              />
            ))}
          </div>
        </div>

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

              {/* Program Scope (required) */}
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
                      onChange={(e) =>
                        setProgramId(e.target.value || null)
                      }
                      className="w-full px-3 py-2.5 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
                      style={dmSans}
                    >
                      <option value="">Select a program</option>
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

        {/* ===== STEP 2: Choose View Type ===== */}
        {step === 2 && (
          <div className="px-6 pb-6">
            <p
              className="text-sm text-[#1B2B3A]/60 mb-5"
              style={dmSans}
            >
              What type of output are you creating?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Narrative */}
              <button
                onClick={() => setViewType("narrative")}
                className={`group relative text-left p-5 border-2 rounded-xl transition-all ${
                  viewType === "narrative"
                    ? "border-[#3A6B8A] bg-[#3A6B8A]/5 ring-2 ring-[#3A6B8A]/20"
                    : "border-[#1B2B3A]/10 hover:border-[#3A6B8A] hover:bg-[#3A6B8A]/5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#3A6B8A]/10 flex items-center justify-center mb-3 group-hover:bg-[#3A6B8A]/20 transition-colors">
                  <FileText className="w-5 h-5 text-[#3A6B8A]" />
                </div>
                <h3
                  className="text-base font-semibold text-[#1B2B3A] mb-1"
                  style={cormorant}
                >
                  Narrative
                </h3>
                <p className="text-xs text-[#1B2B3A]/50" style={dmSans}>
                  Funder reports, board decks, grant narratives, and written
                  summaries.
                </p>
                {viewType === "narrative" && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#3A6B8A] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Interactive */}
              <button
                onClick={() => setViewType("interactive")}
                className={`group relative text-left p-5 border-2 rounded-xl transition-all ${
                  viewType === "interactive"
                    ? "border-[#E9C03A] bg-[#E9C03A]/5 ring-2 ring-[#E9C03A]/20"
                    : "border-[#1B2B3A]/10 hover:border-[#E9C03A] hover:bg-[#E9C03A]/5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#E9C03A]/10 flex items-center justify-center mb-3 group-hover:bg-[#E9C03A]/20 transition-colors">
                  <LayoutDashboard className="w-5 h-5 text-[#BA7517]" />
                </div>
                <h3
                  className="text-base font-semibold text-[#1B2B3A] mb-1"
                  style={cormorant}
                >
                  Interactive
                </h3>
                <p className="text-xs text-[#1B2B3A]/50" style={dmSans}>
                  Impact Command Center, Impact Journey, Orbit View, Staff
                  Dashboard.
                </p>
                {viewType === "interactive" && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E9C03A] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
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
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3()}
                className="px-5 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={dmSans}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Choose Data ===== */}
        {step === 3 && (
          <div className="px-6 pb-6">
            <p
              className="text-sm text-[#1B2B3A]/60 mb-1"
              style={dmSans}
            >
              Select data from your workspace library
            </p>
            <p
              className="text-xs text-[#1B2B3A]/30 mb-4"
              style={dmSans}
            >
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

            {/* Step 3 footer */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
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
                Create Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
