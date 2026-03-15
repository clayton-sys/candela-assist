"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import {
  LayoutDashboard,
  Globe,
  Code,
  Presentation,
  Compass,
  Table,
  ArrowRight,
  Check,
  // Lock is reserved for plan-gated theme enforcement (Starter plan)
  // Lock,
  List,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Theme definitions                                                  */
/* ------------------------------------------------------------------ */

const THEMES = [
  { key: "foundation",      label: "Foundation",      spectrum: "Timeless",       colors: ["#2C3E50", "#8B7355", "#D4C5A9"] },
  { key: "editorial",       label: "Editorial",       spectrum: "Classical",      colors: ["#1A1A2E", "#C9A96E", "#F5F0E8"] },
  { key: "civic",           label: "Civic",           spectrum: "Classical",      colors: ["#1B3A4B", "#4A90A4", "#E8DCC8"] },
  { key: "blueprint",       label: "Blueprint",       spectrum: "Professional",   colors: ["#0D2137", "#2E86AB", "#E0E0E0"] },
  { key: "candela_classic", label: "Candela Classic",  spectrum: "Default",        colors: ["#1B2B3A", "#E9C03A", "#EDE8DE"] },
  { key: "momentum",        label: "Momentum",        spectrum: "Modern",         colors: ["#1E293B", "#3B82F6", "#F1F5F9"] },
  { key: "command",         label: "Command",         spectrum: "Modern",         colors: ["#111827", "#6366F1", "#E5E7EB"] },
  { key: "aurora",          label: "Aurora",          spectrum: "Tech-forward",   colors: ["#0F172A", "#38BDF8", "#A78BFA"] },
  { key: "neon_civic",      label: "Neon Civic",      spectrum: "Bold",           colors: ["#18181B", "#22D3EE", "#F43F5E"] },
  { key: "obsidian",        label: "Obsidian",        spectrum: "Stark minimal",  colors: ["#0A0A0A", "#525252", "#FAFAFA"] },
  { key: "void",            label: "Void",            spectrum: "Alive minimal",  colors: ["#030712", "#10B981", "#1F2937"] },
  { key: "spectra",         label: "Spectra",         spectrum: "Cutting-edge",   colors: ["#1E1B4B", "#8B5CF6", "#EC4899"] },
  { key: "gravity",         label: "Gravity",         spectrum: "Dramatic",       colors: ["#0C0A09", "#DC2626", "#FBBF24"] },
  { key: "plasma",          label: "Plasma",          spectrum: "Kinetic",        colors: ["#170F2E", "#A855F7", "#06B6D4"] },
  { key: "inferno",         label: "Inferno",         spectrum: "Maximum impact", colors: ["#1C0A00", "#F97316", "#EF4444"] },
];

/* ------------------------------------------------------------------ */
/*  View options                                                       */
/* ------------------------------------------------------------------ */

const VIEW_OPTIONS = [
  {
    type: "staff_dashboard",
    label: "Staff Dashboard",
    description: "Dense operational layout with KPI cards and progress bars",
    icon: LayoutDashboard,
  },
  {
    type: "funder_public",
    label: "Funder Public View",
    description: "Dark editorial layout with outcome cards and theory of change",
    icon: Globe,
  },
  {
    type: "embed_widget",
    label: "Website Embed Widget",
    description: "Compact max-400px widget with top metrics and branded footer",
    icon: Code,
  },
  {
    type: "board_deck",
    label: "Board Deck Slide",
    description: "Single-page print-ready layout with key metrics and talking points",
    icon: Presentation,
  },
  {
    type: "command_center",
    label: "Impact Command Center",
    description: "Interactive SVG constellation with clickable metric nodes",
    icon: Compass,
  },
  {
    type: "logic_model",
    label: "Logic Model",
    description: "Standard table — Inputs, Activities, Outputs, Outcomes, Impact",
    icon: Table,
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ViewsPage() {
  const router = useRouter();
  const {
    editedDataPoints,
    selectedViews,
    setSelectedViews,
    theme: contextTheme,
    layout: contextLayout,
    setTheme: setContextTheme,
    setLayout: setContextLayout,
  } = useGrantsWizard();

  const [selected, setSelected] = useState<Set<string>>(new Set(selectedViews));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>(contextTheme);
  const [selectedLayout, setSelectedLayout] = useState<"constellation" | "list">(
    contextLayout as "constellation" | "list"
  );

  useEffect(() => {
    if (editedDataPoints.length === 0) {
      router.replace("/app/impact-studio/edit");
    }
  }, [editedDataPoints, router]);

  function toggleView(viewType: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(viewType)) next.delete(viewType);
      else next.add(viewType);
      return next;
    });
  }

  async function handleGenerate() {
    const views = Array.from(selected);
    if (views.length === 0) return;

    setGenerating(true);
    setError(null);
    setSelectedViews(views);
    setContextTheme(selectedTheme);
    setContextLayout(selectedLayout);

    try {
      const res = await fetch("/api/impact/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataPoints: editedDataPoints,
          selectedViews: views,
          theme: selectedTheme,
          layout: selectedLayout,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Generation failed");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("grs-outputs", JSON.stringify(data.outputs));
      router.push("/app/impact-studio/output");
    } catch {
      setError("Failed to generate views. Please try again.");
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Select Theme & Views
          </h1>
          <p
            className="text-sm text-midnight/50"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Choose a theme, layout, and report views to generate from your{" "}
            {editedDataPoints.length} data points.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {error}
        </div>
      )}

      {/* ── Step 13: Theme Selector ─────────────────────────────── */}
      <div className="mb-6">
        <h2
          className="text-base font-semibold text-midnight mb-3"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Theme
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {THEMES.map((t) => {
            const isSelected = selectedTheme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTheme(t.key)}
                className={`relative flex-shrink-0 w-[130px] p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#E9C03A] bg-[#E9C03A]/5"
                    : "border-midnight/5 bg-white hover:border-midnight/15"
                }`}
              >
                {/* Check mark for selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#E9C03A] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Color swatch */}
                <div className="flex gap-0.5 mb-2 rounded-md overflow-hidden h-5">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <p
                  className="text-xs font-semibold text-midnight truncate"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {t.label}
                </p>
                <p
                  className="text-[10px] text-midnight/40 truncate"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {t.spectrum}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 14: Layout Toggle ──────────────────────────────── */}
      <div className="mb-6">
        <h2
          className="text-base font-semibold text-midnight mb-3"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Layout
        </h2>
        <div className="inline-flex rounded-lg border border-midnight/10 overflow-hidden">
          <button
            onClick={() => setSelectedLayout("constellation")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              selectedLayout === "constellation"
                ? "bg-[#3A6B8A] text-white"
                : "bg-white text-midnight/60 hover:bg-midnight/5"
            }`}
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <Sparkles className="w-4 h-4" />
            Constellation
          </button>
          <button
            onClick={() => setSelectedLayout("list")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              selectedLayout === "list"
                ? "bg-[#3A6B8A] text-white"
                : "bg-white text-midnight/60 hover:bg-midnight/5"
            }`}
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* ── View Selection Grid ─────────────────────────────────── */}
      <div className="mb-6">
        <h2
          className="text-base font-semibold text-midnight mb-3"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Views
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIEW_OPTIONS.map((view) => {
            const isSelected = selected.has(view.type);
            const Icon = view.icon;

            return (
              <button
                key={view.type}
                onClick={() => toggleView(view.type)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-cerulean bg-cerulean/5"
                    : "border-midnight/5 bg-white hover:border-midnight/15"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-cerulean rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <Icon
                  className={`w-8 h-8 mb-3 ${
                    isSelected ? "text-cerulean" : "text-midnight/20"
                  }`}
                />
                <h3
                  className="text-sm font-semibold text-midnight mb-1"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  {view.label}
                </h3>
                <p
                  className="text-[11px] text-midnight/40 leading-relaxed"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {view.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs text-midnight/30"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {selected.size} view{selected.size !== 1 ? "s" : ""} selected
          &middot; {editedDataPoints.length} data points &middot;{" "}
          {THEMES.find((t) => t.key === selectedTheme)?.label ?? selectedTheme}{" "}
          &middot; {selectedLayout === "constellation" ? "Constellation" : "List"}
        </p>
        <button
          onClick={handleGenerate}
          disabled={selected.size === 0 || generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
