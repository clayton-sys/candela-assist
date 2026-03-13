"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, FileText } from "lucide-react";
import IntakeStepper from "@/components/grant-suite/IntakeStepper";
import { BRAND_PRESETS, SWATCH_OPTIONS, DEFAULT_BRAND } from "@/lib/brand-kit/types";
import type { BrandTokens } from "@/lib/brand-kit/types";
import type { DataPoint, AnalysisResult } from "@/lib/grant-suite/types";

type SwatchRole = "primary" | "accent" | "success";

const STARTER_STEPS = ["Add data", "Review & select", "Choose views", "Generate"];
const GROWTH_PRO_STEPS = ["Add data", "Brand kit", "Review & select", "Choose views", "Generate"];

const SOURCE_TABS = ["CSV/Excel", "Paste text", "Grant application", "Prior report", "Enter manually"] as const;
type SourceTab = (typeof SOURCE_TABS)[number];

const PLACEHOLDERS: Record<SourceTab, string> = {
  "CSV/Excel": "",
  "Paste text": "Paste your program data here...",
  "Grant application": "Paste text from your grant application, funder report, or logic model...",
  "Prior report": "Paste your previous impact report or program narrative...",
  "Enter manually": "Enter your program metrics here. Example:\n421 participants served\n89% employment at exit\n$19.40 average starting wage...",
};

const CATEGORY_LABELS: Record<string, string> = {
  core_outcomes: "Core Outcomes",
  volume_enrollment: "Volume & Enrollment",
  demographics: "Demographics",
  benchmarks: "Benchmarks",
  trends: "Trends",
};

const LOADING_MESSAGES = [
  "Extracting metrics...",
  "Identifying data categories...",
  "Calculating benchmarks...",
  "Comparing against targets...",
  "Generating insights...",
  "Analysis complete.",
];

// ── View cards ─────────────────────────────────────────────────────────────

interface ViewCard {
  id: string;
  name: string;
  description: string;
  badge?: { label: string; color: string };
  preSelected: boolean;
  thumbnail: React.ReactNode;
}

const s60 = "rgba(237,232,222,0.6)";
const g60 = "rgba(233,192,58,0.6)";

function Thumb({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" style={{ width: "100%", height: 80, background: "rgba(237,232,222,0.04)", borderRadius: 6, display: "block" }}>
      {children}
    </svg>
  );
}

const VIEW_CARDS: ViewCard[] = [
  {
    id: "command_center", name: "Funder Command Center", description: "Live interactive meeting view",
    badge: { label: "New", color: "#E9C03A" }, preSelected: true,
    thumbnail: <Thumb><circle cx="60" cy="30" r="10" stroke={g60} strokeWidth="1.5" fill="none"/>{[[40,15],[80,15],[90,35],[80,50],[40,50]].map(([x,y],i)=><g key={i}><line x1="60" y1="30" x2={x} y2={y} stroke={s60} strokeWidth="0.8"/><circle cx={x} cy={y} r="6" stroke={s60} strokeWidth="1" fill="none"/></g>)}</Thumb>,
  },
  {
    id: "staff_dashboard", name: "Staff Dashboard", description: "Internal team metrics view",
    badge: { label: "Internal", color: "#0096c7" }, preSelected: true,
    thumbnail: <Thumb><rect x="20" y="16" width="80" height="6" rx="3" fill={s60}/><rect x="20" y="28" width="60" height="6" rx="3" fill={s60}/><rect x="20" y="40" width="40" height="6" rx="3" fill={s60}/></Thumb>,
  },
  {
    id: "funder_public", name: "Funder Public View", description: "Shareable impact summary",
    badge: { label: "Shareable", color: "#1D9E75" }, preSelected: true,
    thumbnail: <Thumb><text x="60" y="35" textAnchor="middle" fontFamily="serif" fontSize="24" fill={s60}>F</text><circle cx="60" cy="46" r="2.5" fill={g60}/></Thumb>,
  },
  {
    id: "board_deck", name: "Board Deck Slide", description: "Ready-to-paste slide",
    preSelected: false,
    thumbnail: <Thumb><rect x="15" y="10" width="90" height="40" rx="3" stroke={s60} strokeWidth="1.2" fill="none"/><line x1="15" y1="22" x2="105" y2="22" stroke={s60} strokeWidth="0.8"/><rect x="22" y="28" width="50" height="4" rx="2" fill={s60}/><rect x="22" y="36" width="35" height="4" rx="2" fill={s60}/></Thumb>,
  },
  {
    id: "website_embed", name: "Website Embed Widget", description: "Embeddable impact widget",
    badge: { label: "Website", color: "rgba(237,232,222,0.5)" }, preSelected: true,
    thumbnail: <Thumb><rect x="15" y="8" width="90" height="44" rx="4" stroke={s60} strokeWidth="1.2" fill="none"/><rect x="15" y="8" width="90" height="10" rx="4" fill="rgba(237,232,222,0.08)"/><circle cx="22" cy="13" r="2" fill={s60}/><circle cx="29" cy="13" r="2" fill={s60}/><circle cx="36" cy="13" r="2" fill={s60}/><rect x="30" y="26" width="60" height="18" rx="3" stroke={s60} strokeWidth="0.8" fill="none"/></Thumb>,
  },
  {
    id: "logic_model", name: "Logic Model", description: "Full logic model view",
    preSelected: false,
    thumbnail: <Thumb>{[20,36,52,68,84].map((x,i)=><rect key={i} x={x} y={50-[28,36,24,32,20][i]} width="10" height={[28,36,24,32,20][i]} rx="2" fill={s60}/>)}</Thumb>,
  },
  {
    id: "grant_report", name: "Grant Report", description: "Funder-ready narrative",
    preSelected: false,
    thumbnail: <Thumb><rect x="25" y="8" width="70" height="44" rx="3" stroke={s60} strokeWidth="1.2" fill="none"/><rect x="25" y="8" width="3" height="44" rx="1" fill={g60}/><rect x="35" y="18" width="45" height="4" rx="2" fill={s60}/><rect x="35" y="26" width="50" height="4" rx="2" fill={s60}/><rect x="35" y="34" width="38" height="4" rx="2" fill={s60}/></Thumb>,
  },
  {
    id: "impact_one_pager", name: "Impact One-Pager", description: "Single-page summary",
    preSelected: false,
    thumbnail: <Thumb><rect x="30" y="5" width="60" height="50" rx="3" stroke={s60} strokeWidth="1.2" fill="none"/><text x="60" y="36" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="14" fontWeight="bold" fill={s60}>421</text></Thumb>,
  },
];

const BADGE_COLORS: Record<string, { border: string; text: string }> = {
  New: { border: "#E9C03A", text: "#E9C03A" },
  Internal: { border: "#0096c7", text: "#0096c7" },
  Shareable: { border: "#1D9E75", text: "#1D9E75" },
  Website: { border: "rgba(237,232,222,0.3)", text: "rgba(237,232,222,0.5)" },
};

export default function NewIntakePage() {
  const router = useRouter();
  const supabase = createClient();

  // Plan & org
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("starter");
  const [loading, setLoading] = useState(true);

  // Steps
  const [currentStep, setCurrentStep] = useState(0);
  const showBrandKit = plan === "growth" || plan === "pro";
  const steps = showBrandKit ? GROWTH_PRO_STEPS : STARTER_STEPS;

  // Step 1 state
  const [sourceTab, setSourceTab] = useState<SourceTab>("CSV/Excel");
  const [rawData, setRawData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 (brand) state
  const [brandLoaded, setBrandLoaded] = useState(false);
  const [brandConfigured, setBrandConfigured] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(false);
  const [brandOrgName, setBrandOrgName] = useState("");
  const [primary, setPrimary] = useState(DEFAULT_BRAND.primary);
  const [accent, setAccent] = useState(DEFAULT_BRAND.accent);
  const [success, setSuccess] = useState(DEFAULT_BRAND.success);
  const [textOnPrimary] = useState(DEFAULT_BRAND.textOnPrimary);
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [hexInputs, setHexInputs] = useState({ primary: DEFAULT_BRAND.primary, accent: DEFAULT_BRAND.accent, success: DEFAULT_BRAND.success });
  const [brandSaving, setBrandSaving] = useState(false);

  // Step 3 state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Step 4 state
  const [selectedViews, setSelectedViews] = useState<string[]>(
    () => VIEW_CARDS.filter((c) => c.preSelected).map((c) => c.id)
  );

  // Step 5 state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [genMsgIdx, setGenMsgIdx] = useState(0);

  // Derived step indices
  const brandStepIndex = showBrandKit ? 1 : -1;
  const reviewStepIndex = showBrandKit ? 2 : 1;
  const chooseViewsStepIndex = showBrandKit ? 3 : 2;
  const generateStepIndex = showBrandKit ? 4 : 3;

  // Load org data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id, orgs(plan)")
        .eq("user_id", user.id)
        .single();

      if (orgUser?.org_id) setOrgId(orgUser.org_id);
      const orgPlan = (orgUser?.orgs as any)?.plan ?? "starter";
      setPlan(orgPlan);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1 validation
  const step1Valid = sourceTab === "CSV/Excel" ? !!uploadedFile : rawData.length > 20;
  const effectiveRawData = sourceTab === "CSV/Excel" ? `[File uploaded: ${uploadedFile?.name}]` : rawData;

  // File handling
  const ACCEPTED_EXTS = [".csv", ".xlsx", ".txt", ".pdf"];
  function handleFile(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) return;
    setUploadedFile(file);
    if (ext === ".csv" || ext === ".txt") {
      const reader = new FileReader();
      reader.onload = (e) => setRawData(e.target?.result as string);
      reader.readAsText(file);
    }
  }

  // Brand step: load brand on entering step
  useEffect(() => {
    if (currentStep !== brandStepIndex || !orgId || brandLoaded) return;
    async function loadBrand() {
      const { data: org } = await supabase
        .from("orgs")
        .select("brand_primary, brand_accent, brand_success, brand_text_on_primary, brand_logo_url, org_display_name, white_label_enabled")
        .eq("id", orgId)
        .single();
      if (org) {
        const p = org.brand_primary ?? DEFAULT_BRAND.primary;
        const a = org.brand_accent ?? DEFAULT_BRAND.accent;
        const s = org.brand_success ?? DEFAULT_BRAND.success;
        setPrimary(p);
        setAccent(a);
        setSuccess(s);
        setHexInputs({ primary: p, accent: a, success: s });
        setBrandOrgName(org.org_display_name ?? "");
        setWhiteLabel(org.white_label_enabled ?? false);
        setBrandConfigured(!!(org.brand_logo_url || (org.brand_primary && org.brand_primary !== "#1B2B3A")));
      }
      setBrandLoaded(true);
    }
    loadBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, orgId, brandStepIndex]);

  // Analysis: trigger on entering review step
  useEffect(() => {
    if (currentStep !== reviewStepIndex || analysisResult || analyzing) return;
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Loading message cycling
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 600);
    return () => clearInterval(interval);
  }, [analyzing]);

  async function runAnalysis() {
    setAnalyzing(true);
    setLoadingMsgIdx(0);
    setAnalysisError("");
    try {
      const res = await fetch("/api/grant-suite/analyze-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: effectiveRawData, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysisResult(data);
      const all: DataPoint[] = [];
      for (const cat of Object.keys(data.categories)) {
        all.push(...data.categories[cat]);
      }
      setDataPoints(all);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  // Chip toggle
  function toggleDataPoint(id: string) {
    setDataPoints((prev) => prev.map((dp) => dp.id === id ? { ...dp, selected: !dp.selected } : dp));
  }

  function toggleAllInCategory(category: string) {
    const catPoints = dataPoints.filter((dp) => dp.category === category);
    const allSelected = catPoints.every((dp) => dp.selected);
    setDataPoints((prev) => prev.map((dp) => dp.category === category ? { ...dp, selected: !allSelected } : dp));
  }

  const selectedCount = dataPoints.filter((dp) => dp.selected).length;
  const step3Valid = selectedCount > 0;

  // Hex helpers
  function isValidHex(hex: string) { return /^#[0-9a-fA-F]{6}$/.test(hex); }
  function handleHexInput(role: SwatchRole, value: string) {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setHexInputs((prev) => ({ ...prev, [role]: normalized }));
    if (isValidHex(normalized)) {
      if (role === "primary") setPrimary(normalized);
      else if (role === "accent") setAccent(normalized);
      else setSuccess(normalized);
    }
  }
  function selectSwatch(role: SwatchRole, color: string) {
    if (role === "primary") setPrimary(color);
    else if (role === "accent") setAccent(color);
    else setSuccess(color);
    setHexInputs((prev) => ({ ...prev, [role]: color }));
  }
  function applyPreset(preset: (typeof BRAND_PRESETS)[number]) {
    setPrimary(preset.primary);
    setAccent(preset.accent);
    setSuccess(preset.success);
    setHexInputs({ primary: preset.primary, accent: preset.accent, success: preset.success });
  }

  async function saveBrand() {
    if (!orgId) return;
    setBrandSaving(true);
    await supabase.from("orgs").update({
      brand_primary: primary,
      brand_accent: accent,
      brand_success: success,
      brand_text_on_primary: textOnPrimary,
      org_display_name: brandOrgName,
      white_label_enabled: whiteLabel,
    }).eq("id", orgId);
    setBrandSaving(false);
    setBrandConfigured(true);
    setCurrentStep(currentStep + 1);
  }

  // View toggle
  function toggleView(id: string) {
    setSelectedViews((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  const step4Valid = selectedViews.length > 0;

  // Generate outputs (Step 5)
  const selectedViewLabels = VIEW_CARDS.filter((c) => selectedViews.includes(c.id)).map((c) => c.name);
  const genMessages = [
    "Creating your program record...",
    ...selectedViewLabels.map((name) => `Generating ${name}...`),
    "Finalizing outputs...",
  ];

  useEffect(() => {
    if (currentStep !== generateStepIndex || generating) return;
    runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setGenMsgIdx((prev) => Math.min(prev + 1, genMessages.length - 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [generating, genMessages.length]);

  async function runGenerate() {
    setGenerating(true);
    setGenMsgIdx(0);
    setGenerateError("");

    const brandTokens: BrandTokens = {
      primary, accent, success, textOnPrimary,
      logoUrl: null, orgDisplayName: brandOrgName, whiteLabel,
    };
    const selectedDPs = dataPoints.filter((dp) => dp.selected);

    try {
      const res = await fetch("/api/grant-suite/generate-outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDataPoints: selectedDPs, selectedViews, brandTokens, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      // Wait until messages finish cycling (at least genMessages.length * 1.2s)
      const minWait = genMessages.length * 1200;
      const elapsed = Date.now() - genStartRef.current;
      const remaining = Math.max(0, minWait - elapsed);
      setTimeout(() => {
        window.location.href = `/app/grant-suite/${data.modelId}`;
      }, remaining);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
      setGenerating(false);
    }
  }
  const genStartRef = useRef(Date.now());
  // Reset gen start on step enter
  useEffect(() => {
    if (currentStep === generateStepIndex) genStartRef.current = Date.now();
  }, [currentStep, generateStepIndex]);

  // Navigation
  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0f1c27" }}>
        <p className="font-jost text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>Loading…</p>
      </div>
    );
  }

  const colorRoles: { key: SwatchRole; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "success", label: "Success" },
  ];
  const colorValues: Record<SwatchRole, string> = { primary, accent, success };

  return (
    <div className="min-h-full" style={{ background: "#0f1c27" }}>
      <IntakeStepper steps={steps} currentStep={currentStep} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* ═══════════════ STEP 1: ADD DATA ═══════════════ */}
        {currentStep === 0 && (
          <div>
            <h1
              className="font-['Cormorant_Garamond'] font-normal"
              style={{ fontSize: 32, color: "#EDE8DE", marginBottom: 24 }}
            >
              What data are you working with?
            </h1>

            {/* Source tabs */}
            <div className="flex gap-0 mb-6" style={{ borderBottom: "1px solid rgba(237,232,222,0.1)" }}>
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSourceTab(tab)}
                  className="font-['DM_Sans'] text-xs px-4 py-2.5 transition-colors"
                  style={{
                    color: sourceTab === tab ? "#E9C03A" : "rgba(237,232,222,0.3)",
                    borderBottom: sourceTab === tab ? "2px solid #E9C03A" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* CSV/Excel tab */}
            {sourceTab === "CSV/Excel" && (
              <div>
                {uploadedFile ? (
                  <div
                    className="flex items-center gap-3 rounded-lg px-5 py-4"
                    style={{
                      border: "1px solid rgba(29,158,117,0.3)",
                      background: "rgba(29,158,117,0.06)",
                    }}
                  >
                    <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#1D9E75" }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-['DM_Sans'] text-sm truncate" style={{ color: "#EDE8DE" }}>
                        {uploadedFile.name}
                      </p>
                      <p className="font-['DM_Sans'] text-xs" style={{ color: "rgba(237,232,222,0.4)" }}>
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setRawData(""); }}
                      className="font-['DM_Sans'] text-xs px-3 py-1 rounded"
                      style={{ color: "rgba(237,232,222,0.5)", border: "1px solid rgba(237,232,222,0.15)" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors"
                    style={{
                      height: 160,
                      border: "1px dashed rgba(237,232,222,0.2)",
                      background: dragOver ? "rgba(237,232,222,0.06)" : "rgba(237,232,222,0.02)",
                      borderRadius: 8,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
                  >
                    <FileText className="w-6 h-6 mb-2" style={{ color: "rgba(237,232,222,0.3)" }} />
                    <p className="font-['DM_Sans'] text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>
                      Drop a CSV, Excel, or PDF file here
                    </p>
                    <p className="font-['DM_Sans'] text-xs mt-1" style={{ color: "rgba(237,232,222,0.25)" }}>
                      or click to browse
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.txt,.pdf"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>
            )}

            {/* Text-based tabs */}
            {sourceTab !== "CSV/Excel" && (
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder={PLACEHOLDERS[sourceTab]}
                className="w-full font-['DM_Sans'] text-sm outline-none resize-y"
                style={{
                  minHeight: 160,
                  background: "rgba(237,232,222,0.03)",
                  border: "0.5px solid rgba(237,232,222,0.1)",
                  borderRadius: 8,
                  padding: 16,
                  color: "#EDE8DE",
                }}
              />
            )}

            {/* Next button */}
            <div className="mt-8">
              <button
                type="button"
                disabled={!step1Valid}
                onClick={goNext}
                className="font-['DM_Sans'] text-sm font-medium px-8 py-2.5 rounded-lg transition-colors"
                style={{
                  background: step1Valid ? "#E9C03A" : "rgba(233,192,58,0.2)",
                  color: step1Valid ? "#1B2B3A" : "rgba(27,43,58,0.4)",
                  cursor: step1Valid ? "pointer" : "not-allowed",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: BRAND KIT (Growth/Pro) ═══════════════ */}
        {showBrandKit && currentStep === brandStepIndex && (
          <div>
            <h1
              className="font-['Cormorant_Garamond'] font-normal"
              style={{ fontSize: 32, color: "#EDE8DE", marginBottom: 24 }}
            >
              Brand kit
            </h1>

            {!brandLoaded ? (
              <p className="font-['DM_Sans'] text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>Loading brand settings…</p>
            ) : brandConfigured && !brandExpanded ? (
              /* Sub-state A: Brand already configured */
              <div>
                <div
                  className="flex items-center gap-3 rounded-lg px-5 py-4 mb-6"
                  style={{ border: "1px solid rgba(29,158,117,0.3)", background: "rgba(29,158,117,0.06)" }}
                >
                  <span className="block rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: "#1D9E75" }} />
                  <span className="font-['DM_Sans'] text-sm flex-1" style={{ color: "#EDE8DE" }}>
                    Using {brandOrgName || "your"} brand kit
                  </span>
                  <button
                    type="button"
                    onClick={() => setBrandExpanded(true)}
                    className="font-['DM_Sans'] text-xs"
                    style={{ color: "#E9C03A" }}
                  >
                    Edit →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  className="font-['DM_Sans'] text-sm font-medium px-8 py-2.5 rounded-lg"
                  style={{ background: "#E9C03A", color: "#1B2B3A" }}
                >
                  Continue →
                </button>
              </div>
            ) : (
              /* Sub-state B: Not configured or expanded editor */
              <div className="flex flex-col gap-6">
                {/* Org name */}
                <div>
                  <label className="block font-['DM_Sans'] text-xs uppercase mb-2" style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}>
                    Organization display name
                  </label>
                  <input
                    type="text"
                    value={brandOrgName}
                    onChange={(e) => setBrandOrgName(e.target.value)}
                    placeholder="e.g. Denver Works"
                    className="w-full rounded-lg px-3 py-2.5 font-['DM_Sans'] text-sm outline-none"
                    style={{ background: "rgba(237,232,222,0.06)", border: "1px solid rgba(237,232,222,0.12)", color: "#EDE8DE" }}
                  />
                </div>

                {/* Presets */}
                <div>
                  <label className="block font-['DM_Sans'] text-xs uppercase mb-3" style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}>
                    Quick presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg"
                        style={{ background: "rgba(237,232,222,0.04)", border: "1px solid rgba(237,232,222,0.1)" }}
                      >
                        <div className="flex gap-1">
                          {[preset.primary, preset.accent, preset.success].map((c, i) => (
                            <span key={i} className="block rounded-full" style={{ width: 14, height: 14, background: c }} />
                          ))}
                        </div>
                        <span className="font-['DM_Sans']" style={{ fontSize: 11, color: "rgba(237,232,222,0.7)" }}>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color pickers */}
                <div className="flex flex-col gap-5">
                  {colorRoles.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block font-['DM_Sans'] text-xs uppercase mb-2" style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}>
                        {label}
                      </label>
                      <div className="flex gap-2 mb-2">
                        {SWATCH_OPTIONS[key].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => selectSwatch(key, color)}
                            className="rounded-full transition-all"
                            style={{
                              width: 28, height: 28, background: color,
                              outline: colorValues[key] === color ? "2px solid #E9C03A" : "2px solid transparent",
                              outlineOffset: 2,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="block rounded" style={{ width: 16, height: 16, background: colorValues[key], flexShrink: 0 }} />
                        <input
                          type="text"
                          value={hexInputs[key]}
                          onChange={(e) => handleHexInput(key, e.target.value)}
                          className="rounded px-2 py-1 font-mono text-xs outline-none w-24"
                          style={{ background: "rgba(237,232,222,0.06)", border: "1px solid rgba(237,232,222,0.12)", color: "#EDE8DE" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={saveBrand}
                    disabled={brandSaving}
                    className="font-['DM_Sans'] text-sm font-medium px-8 py-2.5 rounded-lg"
                    style={{ background: "#E9C03A", color: "#1B2B3A", opacity: brandSaving ? 0.6 : 1 }}
                  >
                    {brandSaving ? "Saving…" : "Save & continue →"}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="font-['DM_Sans'] text-sm transition-colors"
                    style={{ color: "rgba(237,232,222,0.4)", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Skip for now →
                  </button>
                </div>
                {!brandConfigured && (
                  <p className="font-['DM_Sans'] text-xs" style={{ color: "rgba(237,232,222,0.3)" }}>
                    Outputs will use Candela default theme.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ STEP 3: REVIEW & SELECT ═══════════════ */}
        {currentStep === reviewStepIndex && (
          <div>
            <h1
              className="font-['Cormorant_Garamond'] font-normal"
              style={{ fontSize: 32, color: "#EDE8DE", marginBottom: 24 }}
            >
              Review &amp; select data
            </h1>

            {analyzing ? (
              /* Loading state */
              <div className="flex flex-col items-center py-16">
                <div className="w-full overflow-hidden rounded" style={{ height: 4, background: "rgba(237,232,222,0.06)" }}>
                  <div
                    className="h-full rounded"
                    style={{
                      background: "#E9C03A",
                      animation: "analyzeProgress 3.6s ease-out forwards",
                    }}
                  />
                </div>
                <p className="font-['DM_Sans'] text-center mt-6" style={{ fontSize: 13, color: "rgba(237,232,222,0.5)" }}>
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
                <style>{`
                  @keyframes analyzeProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                  }
                `}</style>
              </div>
            ) : analysisError ? (
              <div className="rounded-lg px-5 py-4" style={{ border: "1px solid rgba(230,57,70,0.3)", background: "rgba(230,57,70,0.06)" }}>
                <p className="font-['DM_Sans'] text-sm" style={{ color: "#e63946" }}>{analysisError}</p>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="font-['DM_Sans'] text-xs mt-3 px-4 py-1.5 rounded"
                  style={{ background: "rgba(237,232,222,0.1)", color: "#EDE8DE", border: "1px solid rgba(237,232,222,0.15)" }}
                >
                  Retry
                </button>
              </div>
            ) : analysisResult ? (
              <div>
                {/* Counter */}
                <div className="flex justify-end mb-4">
                  <span className="font-['DM_Sans']" style={{ fontSize: 11, color: "rgba(237,232,222,0.5)" }}>
                    {selectedCount} / {dataPoints.length} data points selected
                  </span>
                </div>

                {/* AI Insights */}
                <div
                  className="rounded-lg mb-8"
                  style={{
                    borderLeft: "3px solid #E9C03A",
                    padding: "16px 20px",
                    background: "rgba(233,192,58,0.06)",
                  }}
                >
                  <p className="font-['DM_Sans'] uppercase mb-2" style={{ fontSize: 10, color: "#E9C03A", letterSpacing: "0.08em" }}>
                    ✦ AI Insights
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {analysisResult.insights.map((insight, i) => (
                      <li key={i} className="font-['DM_Sans'] flex gap-2" style={{ fontSize: 13, color: "rgba(237,232,222,0.7)" }}>
                        <span style={{ color: "rgba(237,232,222,0.3)" }}>•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Data point chips by category */}
                <div className="flex flex-col gap-6">
                  {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => {
                    const catPoints = dataPoints.filter((dp) => dp.category === cat);
                    if (catPoints.length === 0) return null;
                    const allSelected = catPoints.every((dp) => dp.selected);
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-['DM_Sans'] uppercase" style={{ fontSize: 11, color: "rgba(237,232,222,0.4)", letterSpacing: "0.06em" }}>
                            {CATEGORY_LABELS[cat]}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAllInCategory(cat)}
                            className="font-['DM_Sans']"
                            style={{ fontSize: 11, color: "#0096c7" }}
                          >
                            {allSelected ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {catPoints.map((dp) => (
                            <button
                              key={dp.id}
                              type="button"
                              onClick={() => toggleDataPoint(dp.id)}
                              className="font-['DM_Sans'] rounded-md px-3 py-1.5 transition-colors"
                              style={{
                                fontSize: 12,
                                border: dp.selected
                                  ? "0.5px solid #E9C03A"
                                  : "0.5px solid rgba(237,232,222,0.12)",
                                color: dp.selected ? "#E9C03A" : "rgba(237,232,222,0.3)",
                                background: dp.selected ? "rgba(233,192,58,0.06)" : "transparent",
                              }}
                            >
                              {dp.label}: {dp.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next button */}
                <div className="mt-8">
                  <button
                    type="button"
                    disabled={!step3Valid}
                    onClick={goNext}
                    className="font-['DM_Sans'] text-sm font-medium px-8 py-2.5 rounded-lg transition-colors"
                    style={{
                      background: step3Valid ? "#E9C03A" : "rgba(233,192,58,0.2)",
                      color: step3Valid ? "#1B2B3A" : "rgba(27,43,58,0.4)",
                      cursor: step3Valid ? "pointer" : "not-allowed",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ═══════════════ STEP 4: CHOOSE VIEWS ═══════════════ */}
        {currentStep === chooseViewsStepIndex && (
          <div>
            <h1
              className="font-['Cormorant_Garamond'] font-normal"
              style={{ fontSize: 32, color: "#EDE8DE", marginBottom: 8 }}
            >
              Choose your views
            </h1>
            <p className="font-['DM_Sans'] mb-6" style={{ fontSize: 12, color: "rgba(237,232,222,0.5)" }}>
              {selectedViews.length} views selected
            </p>

            {/* Selected data point chips preview */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {dataPoints.filter((dp) => dp.selected).slice(0, 10).map((dp) => (
                <span
                  key={dp.id}
                  className="font-['DM_Sans'] rounded-md px-2.5 py-1"
                  style={{ fontSize: 11, border: "0.5px solid #E9C03A", color: "#E9C03A", background: "rgba(233,192,58,0.06)" }}
                >
                  {dp.label}: {dp.value}
                </span>
              ))}
              {dataPoints.filter((dp) => dp.selected).length > 10 && (
                <span
                  className="font-['DM_Sans'] rounded-md px-2.5 py-1"
                  style={{ fontSize: 11, color: "rgba(237,232,222,0.4)", border: "0.5px solid rgba(237,232,222,0.12)" }}
                >
                  +{dataPoints.filter((dp) => dp.selected).length - 10} more
                </span>
              )}
            </div>

            {/* View cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {VIEW_CARDS.map((card) => {
                const sel = selectedViews.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleView(card.id)}
                    className="text-left relative rounded-[10px] transition-all"
                    style={{
                      padding: 16,
                      border: sel ? "0.5px solid #E9C03A" : "0.5px solid rgba(237,232,222,0.1)",
                      background: sel ? "rgba(233,192,58,0.06)" : "rgba(237,232,222,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    {/* Checkmark */}
                    {sel && (
                      <span
                        className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                        style={{ width: 12, height: 12, background: "#E9C03A" }}
                      >
                        <Check className="w-2 h-2 text-[#1B2B3A]" strokeWidth={3} />
                      </span>
                    )}

                    {/* Thumbnail */}
                    {card.thumbnail}

                    {/* Name */}
                    <p className="font-['DM_Sans'] font-semibold mt-2.5" style={{ fontSize: 13, color: "rgba(237,232,222,0.9)" }}>
                      {card.name}
                    </p>

                    {/* Description */}
                    <p className="font-['DM_Sans']" style={{ fontSize: 11, color: "rgba(237,232,222,0.5)", marginTop: 2 }}>
                      {card.description}
                    </p>

                    {/* Badge */}
                    {card.badge && (
                      <span
                        className="inline-block font-['DM_Sans'] uppercase mt-2"
                        style={{
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 100,
                          border: `0.5px solid ${BADGE_COLORS[card.badge.label]?.border ?? card.badge.color}`,
                          color: BADGE_COLORS[card.badge.label]?.text ?? card.badge.color,
                        }}
                      >
                        {card.badge.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Generate button */}
            <div className="mt-8">
              <button
                type="button"
                disabled={!step4Valid}
                onClick={goNext}
                className="font-['DM_Sans'] text-sm font-medium px-8 py-2.5 rounded-lg transition-colors"
                style={{
                  background: step4Valid ? "#E9C03A" : "rgba(233,192,58,0.2)",
                  color: step4Valid ? "#1B2B3A" : "rgba(27,43,58,0.4)",
                  cursor: step4Valid ? "pointer" : "not-allowed",
                }}
              >
                Generate selected views →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ STEP 5: PROGRESS SCREEN ═══════════════ */}
      {currentStep === generateStepIndex && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#091421" }}
        >
          {generateError ? (
            /* Error state */
            <div className="text-center" style={{ maxWidth: 420, padding: 24 }}>
              <h2
                className="font-['Cormorant_Garamond'] font-normal mb-4"
                style={{ fontSize: 24, color: "#EDE8DE" }}
              >
                Something went wrong
              </h2>
              <p className="font-['DM_Sans'] text-sm mb-6" style={{ color: "rgba(237,232,222,0.5)" }}>
                {generateError}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => { setGenerateError(""); runGenerate(); }}
                  className="font-['DM_Sans'] text-sm font-medium px-6 py-2.5 rounded-lg"
                  style={{ background: "#E9C03A", color: "#1B2B3A" }}
                >
                  Try again
                </button>
                <a
                  href="/app/grant-suite"
                  className="font-['DM_Sans'] text-sm"
                  style={{ color: "rgba(237,232,222,0.4)" }}
                >
                  Go to dashboard
                </a>
              </div>
            </div>
          ) : (
            /* Loading state */
            <div className="text-center">
              {/* Pulsing dot */}
              <div
                className="mx-auto mb-8 rounded-full"
                style={{
                  width: 12,
                  height: 12,
                  background: "#E9C03A",
                  animation: "genPulse 1.2s ease-in-out infinite",
                }}
              />
              <p className="font-['DM_Sans']" style={{ fontSize: 14, color: "rgba(237,232,222,0.6)" }}>
                {genMessages[genMsgIdx] ?? genMessages[genMessages.length - 1]}
              </p>
              <style>{`
                @keyframes genPulse {
                  0%, 100% { opacity: 0.4; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.3); }
                }
              `}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
