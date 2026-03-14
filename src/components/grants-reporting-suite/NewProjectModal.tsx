"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, FileText, ClipboardList, Plus, Loader2 } from "lucide-react";

interface Program {
  id: string;
  name: string;
}

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function NewProjectModal({
  onClose,
  onCreated,
}: NewProjectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

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

  // Step 2 / submission
  const [creating, setCreating] = useState(false);

  const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
  const cormorant = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  } as const;

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
          // No programs exist — show inline create
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

  function canProceedToStep2(): boolean {
    if (!projectName.trim()) return false;
    // If showing new program input, must have a name
    if (showNewProgramInput && !newProgramName.trim() && programs.length === 0) {
      return false;
    }
    return true;
  }

  async function handleSelectPath(
    projectType: "output_generator" | "funder_format"
  ) {
    if (creating) return;
    setCreating(true);

    try {
      const supabase = createClient();
      if (!orgId || !userId) return;

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
          period_label: periodLabel.trim() || null,
          program_id: finalProgramId,
          project_type: projectType,
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
      router.push("/app/grants-reporting-suite/input");
    } catch (err) {
      console.error("Error creating project:", err);
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2B3A]/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1B2B3A]" style={cormorant}>
              New Project
            </h2>
            <p className="text-xs text-[#1B2B3A]/40 mt-0.5" style={dmSans}>
              Step {step} of 2
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
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 1 ? "bg-[#3A6B8A]" : "bg-[#1B2B3A]/10"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 2 ? "bg-[#3A6B8A]" : "bg-[#1B2B3A]/10"
              }`}
            />
          </div>
        </div>

        {/* Step 1: Project details */}
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
                    (leave blank for internal)
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

              {/* Program Assignment */}
              <div>
                <label
                  className="block text-xs font-medium text-[#1B2B3A]/60 mb-1.5"
                  style={dmSans}
                >
                  Program
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
                      <option value="">No program</option>
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

        {/* Step 2: Path selector */}
        {step === 2 && (
          <div className="px-6 pb-6">
            <p
              className="text-sm text-[#1B2B3A]/60 mb-5"
              style={dmSans}
            >
              What kind of project is this?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Output Generator */}
              <button
                onClick={() => handleSelectPath("output_generator")}
                disabled={creating}
                className="group relative text-left p-5 border-2 border-[#1B2B3A]/10 rounded-xl hover:border-[#3A6B8A] hover:bg-[#3A6B8A]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3A6B8A]/10 flex items-center justify-center mb-3 group-hover:bg-[#3A6B8A]/20 transition-colors">
                  <FileText className="w-5 h-5 text-[#3A6B8A]" />
                </div>
                <h3
                  className="text-base font-semibold text-[#1B2B3A] mb-1"
                  style={cormorant}
                >
                  I have my data
                </h3>
                <p className="text-xs text-[#1B2B3A]/50" style={dmSans}>
                  Paste your program data and generate funder-ready narratives,
                  charts, and summaries.
                </p>
                {creating && (
                  <Loader2 className="absolute top-4 right-4 w-4 h-4 animate-spin text-[#3A6B8A]" />
                )}
              </button>

              {/* Funder Format */}
              <button
                onClick={() => handleSelectPath("funder_format")}
                disabled={creating}
                className="group relative text-left p-5 border-2 border-[#1B2B3A]/10 rounded-xl hover:border-[#E9C03A] hover:bg-[#E9C03A]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-[#E9C03A]/10 flex items-center justify-center mb-3 group-hover:bg-[#E9C03A]/20 transition-colors">
                  <ClipboardList className="w-5 h-5 text-[#BA7517]" />
                </div>
                <h3
                  className="text-base font-semibold text-[#1B2B3A] mb-1"
                  style={cormorant}
                >
                  I have a funder&apos;s format
                </h3>
                <p className="text-xs text-[#1B2B3A]/50" style={dmSans}>
                  Upload or describe your funder&apos;s required format and
                  we&apos;ll match your data to it.
                </p>
                {creating && (
                  <Loader2 className="absolute top-4 right-4 w-4 h-4 animate-spin text-[#BA7517]" />
                )}
              </button>
            </div>

            {/* Back button */}
            <div className="flex justify-start mt-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={creating}
                className="text-sm text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors disabled:opacity-40"
                style={dmSans}
              >
                &larr; Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
