"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  X,
  Upload,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SkipForward,
  Check,
  Loader2,
  Palette,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ---------- types ---------- */
interface DataPoint {
  id: string;
  label: string;
  value: string;
  category: string;
}

interface OrgFormState {
  orgName: string;
  programs: string[];
  logoFile: File | null;
  logoPreviewUrl: string | null;
  primaryColor: string;
  mission: string;
}

/* ================================================================== */
/*  ONBOARDING PAGE                                                    */
/* ================================================================== */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // ---- Step 1 state ----
  const [org, setOrg] = useState<OrgFormState>({
    orgName: "",
    programs: [""],
    logoFile: null,
    logoPreviewUrl: null,
    primaryColor: "#1B2B3A",
    mission: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Step 2 state ----
  const [rawData, setRawData] = useState("");

  // ---- Step 3 state ----
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  /* ---- helpers ---- */
  const canAdvanceStep1 =
    org.orgName.trim().length > 0 &&
    org.programs.some((p) => p.trim().length > 0);

  const canAdvanceStep2 = rawData.trim().length >= 50;

  const addProgram = () =>
    setOrg((prev) => ({ ...prev, programs: [...prev.programs, ""] }));

  const updateProgram = (index: number, value: string) =>
    setOrg((prev) => {
      const programs = [...prev.programs];
      programs[index] = value;
      return { ...prev, programs };
    });

  const removeProgram = (index: number) =>
    setOrg((prev) => ({
      ...prev,
      programs: prev.programs.filter((_, i) => i !== index),
    }));

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOrg((prev) => ({
      ...prev,
      logoFile: file,
      logoPreviewUrl: URL.createObjectURL(file),
    }));
  };

  /* ---- Step 3: analyze & generate ---- */
  const runGeneration = useCallback(async () => {
    setStep3Error(null);
    setAnalyzing(true);
    try {
      // 1) Analyze
      const analyzeRes = await fetch("/api/impact/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData }),
      });
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }
      const { dataPoints } = (await analyzeRes.json()) as {
        dataPoints: DataPoint[];
      };

      setAnalyzing(false);
      setGenerating(true);

      // 2) Generate impact_command_center view
      const genRes = await fetch("/api/impact/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataPoints,
          selectedViews: ["impact_command_center"],
        }),
      });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Generation failed");
      }
      const { outputs } = (await genRes.json()) as {
        outputs: Record<string, string>;
      };
      setGeneratedHtml(outputs.impact_command_center ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setStep3Error(message);
    } finally {
      setAnalyzing(false);
      setGenerating(false);
    }
  }, [rawData]);

  // Auto-run generation when entering step 3
  useEffect(() => {
    if (step === 3 && !generatedHtml && !analyzing && !generating) {
      runGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ---- Complete onboarding: save to Supabase ---- */
  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1) Create org
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: org.orgName.trim(),
          primary_color: org.primaryColor,
          mission: org.mission.trim() || null,
        })
        .select("id")
        .single();
      if (orgError) throw orgError;
      const orgId = orgData.id;

      // 2) Link user to org
      await supabase.from("org_users").insert({
        org_id: orgId,
        user_id: user.id,
        role: "owner",
      });

      // 3) Upload logo if present
      if (org.logoFile) {
        const ext = org.logoFile.name.split(".").pop() || "png";
        const path = `logos/${orgId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, org.logoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("brand-assets")
            .getPublicUrl(path);
          await supabase
            .from("organizations")
            .update({ logo_url: urlData.publicUrl })
            .eq("id", orgId);
        }
      }

      // 4) Create programs
      const validPrograms = org.programs.filter((p) => p.trim().length > 0);
      if (validPrograms.length > 0) {
        await supabase.from("programs").insert(
          validPrograms.map((name) => ({
            org_id: orgId,
            name: name.trim(),
          }))
        );
      }

      // 5) Create brand kit
      await supabase.from("brand_kits").insert({
        org_id: orgId,
        primary_color: org.primaryColor,
        font_heading: "Cormorant Garamond",
        font_body: "DM Sans",
      });

      // 6) Create an initial project + project_run if we have data
      if (rawData.trim().length >= 50) {
        const { data: projectData } = await supabase
          .from("projects")
          .insert({
            org_id: orgId,
            name: `${org.orgName.trim()} — Onboarding Report`,
          })
          .select("id")
          .single();

        if (projectData) {
          await supabase.from("project_runs").insert({
            project_id: projectData.id,
            raw_data: rawData,
            generated_html: generatedHtml,
            view_type: "impact_command_center",
          });
        }
      }

      // 7) Set onboarding complete flag on user metadata
      await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      });

      router.push("/app");
    } catch (err) {
      console.error("Onboarding save error:", err);
      setStep3Error("Failed to save your setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Skip onboarding ---- */
  const skipSetup = () => {
    router.push("/app");
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div
      className="min-h-screen bg-midnight-gradient flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ---- Top bar ---- */}
      <header className="flex items-center justify-between px-8 py-5">
        <h1
          className="text-xl text-gold tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Candela Assist
        </h1>
        <button
          onClick={skipSetup}
          className="flex items-center gap-1.5 text-sm text-stone/50 hover:text-stone/80 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Skip setup
        </button>
      </header>

      {/* ---- Step indicator ---- */}
      <div className="flex items-center justify-center gap-3 py-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                s === step
                  ? "bg-gold scale-125 ring-2 ring-gold/30"
                  : s < step
                  ? "bg-gold/60"
                  : "bg-stone/20"
              }`}
            />
            {s < 3 && (
              <div
                className={`w-12 h-px ${
                  s < step ? "bg-gold/40" : "bg-stone/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ---- Steps ---- */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        {step === 1 && (
          <Step1
            org={org}
            setOrg={setOrg}
            fileInputRef={fileInputRef}
            handleLogoSelect={handleLogoSelect}
            addProgram={addProgram}
            updateProgram={updateProgram}
            removeProgram={removeProgram}
            canAdvance={canAdvanceStep1}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            rawData={rawData}
            setRawData={setRawData}
            canAdvance={canAdvanceStep2}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3
            analyzing={analyzing}
            generating={generating}
            generatedHtml={generatedHtml}
            error={step3Error}
            saving={saving}
            onBack={() => setStep(2)}
            onRetry={runGeneration}
            onComplete={completeOnboarding}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 1 — Tell us about your org                                    */
/* ================================================================== */
function Step1({
  org,
  setOrg,
  fileInputRef,
  handleLogoSelect,
  addProgram,
  updateProgram,
  removeProgram,
  canAdvance,
  onNext,
}: {
  org: OrgFormState;
  setOrg: React.Dispatch<React.SetStateAction<OrgFormState>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addProgram: () => void;
  updateProgram: (i: number, v: string) => void;
  removeProgram: (i: number) => void;
  canAdvance: boolean;
  onNext: () => void;
}) {
  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* ---- Form (3 cols) ---- */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold/60 mb-1">
            Step 1 of 3
          </p>
          <h2
            className="text-2xl text-stone"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            Tell us about your organization
          </h2>
          <p className="text-sm text-stone/50 mt-1">
            This info powers your branded reports and dashboards.
          </p>
        </div>

        {/* Org name */}
        <div>
          <label className="block text-sm text-stone/70 mb-1.5">
            Organization name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/30" />
            <input
              type="text"
              value={org.orgName}
              onChange={(e) =>
                setOrg((prev) => ({ ...prev, orgName: e.target.value }))
              }
              placeholder="e.g. Community Health Alliance"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-midnight-light border border-stone/10 text-stone placeholder:text-stone/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 text-sm"
            />
          </div>
        </div>

        {/* Programs */}
        <div>
          <label className="block text-sm text-stone/70 mb-1.5">
            Program names *
          </label>
          <div className="space-y-2">
            {org.programs.map((program, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={program}
                  onChange={(e) => updateProgram(i, e.target.value)}
                  placeholder={`Program ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-midnight-light border border-stone/10 text-stone placeholder:text-stone/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 text-sm"
                />
                {org.programs.length > 1 && (
                  <button
                    onClick={() => removeProgram(i)}
                    className="px-2 text-stone/30 hover:text-coral transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addProgram}
            className="flex items-center gap-1 mt-2 text-xs text-cerulean hover:text-cerulean/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add another program
          </button>
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-sm text-stone/70 mb-1.5">
            Logo (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-stone/20 text-stone/50 hover:border-gold/30 hover:text-stone/70 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            {org.logoFile ? org.logoFile.name : "Upload logo"}
          </button>
        </div>

        {/* Primary color */}
        <div>
          <label className="block text-sm text-stone/70 mb-1.5">
            <Palette className="w-3.5 h-3.5 inline mr-1 opacity-50" />
            Primary brand color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={org.primaryColor}
              onChange={(e) =>
                setOrg((prev) => ({
                  ...prev,
                  primaryColor: e.target.value,
                }))
              }
              className="w-10 h-10 rounded-lg border border-stone/10 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-stone/40 font-mono">
              {org.primaryColor}
            </span>
          </div>
        </div>

        {/* Mission */}
        <div>
          <label className="block text-sm text-stone/70 mb-1.5">
            Mission statement (optional)
          </label>
          <textarea
            value={org.mission}
            onChange={(e) =>
              setOrg((prev) => ({ ...prev, mission: e.target.value }))
            }
            rows={3}
            placeholder="A sentence or two about what your organization does..."
            className="w-full px-4 py-2.5 rounded-lg bg-midnight-light border border-stone/10 text-stone placeholder:text-stone/25 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 text-sm resize-none"
          />
        </div>

        {/* Next */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-midnight font-medium text-sm hover:bg-gold/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---- Live preview (2 cols) ---- */}
      <div className="lg:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-stone/30 mb-3">
          Live preview
        </p>
        <div
          className="rounded-xl overflow-hidden border border-stone/10 shadow-lg"
          style={{ backgroundColor: org.primaryColor }}
        >
          {/* Card header */}
          <div className="px-5 py-4 flex items-center gap-3">
            {org.logoPreviewUrl ? (
              <img
                src={org.logoPreviewUrl}
                alt="Logo preview"
                className="w-10 h-10 rounded-lg object-cover bg-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white/40" />
              </div>
            )}
            <div>
              <p
                className="text-base text-white font-semibold leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                }}
              >
                {org.orgName || "Your Organization"}
              </p>
              {org.programs.filter((p) => p.trim()).length > 0 && (
                <p className="text-[11px] text-white/60 mt-0.5">
                  {org.programs.filter((p) => p.trim()).join(" / ")}
                </p>
              )}
            </div>
          </div>

          {/* Card body */}
          <div className="bg-stone/95 px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-midnight/40">
                  Participants
                </p>
                <p className="text-lg font-bold text-midnight">--</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-midnight/40">
                  Outcomes
                </p>
                <p className="text-lg font-bold text-midnight">--</p>
              </div>
            </div>
            {org.mission && (
              <p className="text-xs text-midnight/50 mt-3 leading-relaxed italic">
                &ldquo;{org.mission}&rdquo;
              </p>
            )}
            <div className="mt-3 flex items-center gap-1.5">
              <div
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: org.primaryColor }}
              />
              <span className="text-[9px] text-midnight/30">
                Powered by Candela
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 2 — Show us what you do                                       */
/* ================================================================== */
function Step2({
  rawData,
  setRawData,
  canAdvance,
  onBack,
  onNext,
}: {
  rawData: string;
  setRawData: (v: string) => void;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const charCount = rawData.trim().length;
  const charMin = 50;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold/60 mb-1">
          Step 2 of 3
        </p>
        <h2
          className="text-2xl text-stone"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          Show us what you do
        </h2>
        <p className="text-sm text-stone/50 mt-1">
          Paste any outcome data you have. Rough is fine — spreadsheet rows,
          quarterly report snippets, grant narrative fragments. One paragraph
          minimum.
        </p>
      </div>

      <div className="relative">
        <textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          rows={12}
          placeholder={`Example:\n\nIn Q3 2025, our Youth Mentorship Program served 142 participants across 3 sites. 87% of participants showed improved school attendance (up from 72% in Q2). We conducted 340 one-on-one mentoring sessions. 23 participants transitioned to employment. Staff retention rate was 94%. Annual budget: $280,000 with 12 FTEs.`}
          className="w-full px-4 py-3 rounded-xl bg-midnight-light border border-stone/10 text-stone placeholder:text-stone/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 text-sm resize-none leading-relaxed"
        />
        {/* Character count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {charCount >= charMin && (
            <Check className="w-3.5 h-3.5 text-teal" />
          )}
          <span
            className={`text-xs font-mono ${
              charCount >= charMin ? "text-teal/70" : "text-stone/30"
            }`}
          >
            {charCount} / {charMin} min
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone/10 text-stone/50 hover:text-stone/80 hover:border-stone/20 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-midnight font-medium text-sm hover:bg-gold/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Generate preview <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 3 — See what Candela can do                                   */
/* ================================================================== */
function Step3({
  analyzing,
  generating,
  generatedHtml,
  error,
  saving,
  onBack,
  onRetry,
  onComplete,
}: {
  analyzing: boolean;
  generating: boolean;
  generatedHtml: string | null;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onRetry: () => void;
  onComplete: () => void;
}) {
  const isLoading = analyzing || generating;

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold/60 mb-1">
            Step 3 of 3
          </p>
          <h2
            className="text-2xl text-stone"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            See what Candela can do
          </h2>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-stone/40 hover:text-stone/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Edit data
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm text-stone/60">
            {analyzing
              ? "Analyzing your data..."
              : "Generating your Command Center..."}
          </p>
          <p className="text-xs text-stone/30">
            This may take 20-30 seconds
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={onRetry}
            className="px-5 py-2 rounded-lg bg-gold text-midnight text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Generated view */}
      {generatedHtml && !isLoading && !error && (
        <>
          <div className="rounded-xl overflow-hidden border border-stone/10 shadow-2xl bg-midnight">
            <iframe
              srcDoc={generatedHtml}
              className="w-full border-0"
              style={{ height: "70vh" }}
              title="Generated Command Center Preview"
              sandbox="allow-scripts"
            />
          </div>

          {/* Complete button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={onComplete}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-midnight font-semibold text-base hover:bg-gold/90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Welcome to your workspace{" "}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
