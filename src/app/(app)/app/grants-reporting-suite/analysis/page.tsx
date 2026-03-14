"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import type { DataPoint } from "../context/GrantsWizardContext";
import { ArrowRight, Lightbulb } from "lucide-react";
import DataPointChips from "@/components/grants-reporting-suite/DataPointChips";

const CATEGORY_LABELS: Record<string, string> = {
  outcomes: "Core Outcomes",
  volume: "Volume",
  demographics: "Demographics",
  sector: "Sector",
  benchmarks: "Benchmarks",
};

export default function AnalysisPage() {
  const router = useRouter();
  const { rawData, analysisResults, setAnalysisResults, setSelectedDataPoints } =
    useGrantsWizard();
  const [loading, setLoading] = useState(!analysisResults);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<DataPoint[]>(
    analysisResults?.dataPoints ?? []
  );
  const [insights, setInsights] = useState<string[]>(
    analysisResults?.insights ?? []
  );

  useEffect(() => {
    if (analysisResults) return;
    if (!rawData) {
      router.replace("/app/grants-reporting-suite/input");
      return;
    }

    async function analyze() {
      try {
        const res = await fetch("/api/grants/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawData }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error ?? "Analysis failed");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const enriched = data.dataPoints.map((dp: DataPoint) => ({
          ...dp,
          selected: true,
        }));
        setPoints(enriched);
        setInsights(data.insights ?? []);
        setAnalysisResults({ dataPoints: enriched, insights: data.insights ?? [] });
        setLoading(false);
      } catch {
        setError("Failed to analyze data. Please try again.");
        setLoading(false);
      }
    }

    analyze();
  }, [rawData, analysisResults, setAnalysisResults, router]);

  function togglePoint(id: string) {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }

  function toggleCategory(category: string) {
    const categoryPoints = points.filter((p) => p.category === category);
    const allSelected = categoryPoints.every((p) => p.selected);
    setPoints((prev) =>
      prev.map((p) =>
        p.category === category ? { ...p, selected: !allSelected } : p
      )
    );
  }

  function handleContinue() {
    const selected = points.filter((p) => p.selected);
    setSelectedDataPoints(selected);
    setAnalysisResults({ dataPoints: points, insights });
    router.push("/app/grants-reporting-suite/edit");
  }

  const selectedCount = points.filter((p) => p.selected).length;
  const categories = Array.from(new Set(points.map((p) => p.category)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-cerulean border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-midnight/40" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Analyzing your data with AI...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Data Analysis
          </h1>
          <p className="text-sm text-midnight/50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {selectedCount} of {points.length} data points selected
          </p>
        </div>
        <button
          onClick={handleContinue}
          disabled={selectedCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data points */}
        <div className="lg:col-span-2 space-y-5">
          {categories.map((cat) => (
            <DataPointChips
              key={cat}
              category={cat}
              label={CATEGORY_LABELS[cat] ?? cat}
              points={points.filter((p) => p.category === cat)}
              onToggle={togglePoint}
              onToggleAll={() => toggleCategory(cat)}
            />
          ))}
        </div>

        {/* Insights panel */}
        <div className="bg-white rounded-xl border border-midnight/5 p-4 h-fit sticky top-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-gold" />
            <h2
              className="text-sm font-semibold text-midnight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              AI Insights
            </h2>
          </div>
          <ul className="space-y-2.5">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="text-xs text-midnight/60 leading-relaxed pl-3 border-l-2 border-gold/30"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
