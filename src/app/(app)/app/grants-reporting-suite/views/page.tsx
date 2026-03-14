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
} from "lucide-react";

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
    label: "Funder Command Center",
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

export default function ViewsPage() {
  const router = useRouter();
  const { editedDataPoints, selectedViews, setSelectedViews } = useGrantsWizard();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedViews));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editedDataPoints.length === 0) {
      router.replace("/app/grants-reporting-suite/edit");
    }
  }, [editedDataPoints, router]);

  function toggle(viewType: string) {
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

    try {
      const res = await fetch("/api/grants/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataPoints: editedDataPoints,
          selectedViews: views,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Generation failed");
        setGenerating(false);
        return;
      }

      // Store outputs in sessionStorage for the output page
      const data = await res.json();
      sessionStorage.setItem("grs-outputs", JSON.stringify(data.outputs));
      router.push("/app/grants-reporting-suite/output");
    } catch {
      setError("Failed to generate views. Please try again.");
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Select Views
          </h1>
          <p className="text-sm text-midnight/50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Choose which report views to generate from your {editedDataPoints.length} data points.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {VIEW_OPTIONS.map((view) => {
          const isSelected = selected.has(view.type);
          const Icon = view.icon;

          return (
            <button
              key={view.type}
              onClick={() => toggle(view.type)}
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
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {view.label}
              </h3>
              <p className="text-[11px] text-midnight/40 leading-relaxed" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {view.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-midnight/30" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {selected.size} view{selected.size !== 1 ? "s" : ""} selected
          &middot; {editedDataPoints.length} data points
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
