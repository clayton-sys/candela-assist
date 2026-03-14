"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import type { DataPoint } from "../context/GrantsWizardContext";
import { ArrowRight, RotateCcw, Trash2 } from "lucide-react";

export default function EditPage() {
  const router = useRouter();
  const { selectedDataPoints, setEditedDataPoints } = useGrantsWizard();
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [originals, setOriginals] = useState<Map<string, DataPoint>>(new Map());

  useEffect(() => {
    if (selectedDataPoints.length === 0) {
      router.replace("/app/grants-reporting-suite/analysis");
      return;
    }
    setPoints(selectedDataPoints.map((p) => ({ ...p })));
    setOriginals(new Map(selectedDataPoints.map((p) => [p.id, { ...p }])));
  }, [selectedDataPoints, router]);

  function updateLabel(id: string, label: string) {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  }

  function updateValue(id: string, value: string) {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, value } : p)));
  }

  function removePoint(id: string) {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }

  function resetPoint(id: string) {
    const original = originals.get(id);
    if (!original) return;
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...original } : p)));
  }

  function handleContinue() {
    setEditedDataPoints(points);
    router.push("/app/grants-reporting-suite/views");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Edit Data Points
          </h1>
          <p className="text-sm text-midnight/50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Refine labels and values before generating views. {points.length} data points.
          </p>
        </div>
        <button
          onClick={handleContinue}
          disabled={points.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {points.length === 0 ? (
        <div className="text-center py-12 text-midnight/30 text-sm" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No data points to edit. Go back and select some.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_72px] gap-3 px-4 pb-1">
            <span className="text-[11px] font-medium text-midnight/40 uppercase tracking-wider" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Label
            </span>
            <span className="text-[11px] font-medium text-midnight/40 uppercase tracking-wider" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Value
            </span>
            <span />
          </div>

          {points.map((point) => {
            const original = originals.get(point.id);
            const isModified =
              original &&
              (original.label !== point.label || original.value !== point.value);

            return (
              <div
                key={point.id}
                className="grid grid-cols-[1fr_1fr_72px] gap-3 items-center bg-white rounded-lg border border-midnight/5 px-4 py-2.5"
              >
                <input
                  type="text"
                  value={point.label}
                  onChange={(e) => updateLabel(point.id, e.target.value)}
                  className="text-sm text-midnight bg-transparent border-b border-transparent hover:border-midnight/10 focus:border-cerulean focus:outline-none py-0.5"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                />
                <input
                  type="text"
                  value={point.value}
                  onChange={(e) => updateValue(point.id, e.target.value)}
                  className="text-sm text-midnight bg-transparent border-b border-transparent hover:border-midnight/10 focus:border-cerulean focus:outline-none py-0.5"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                />
                <div className="flex items-center gap-1 justify-end">
                  {isModified && (
                    <button
                      onClick={() => resetPoint(point.id)}
                      className="p-1.5 text-midnight/20 hover:text-cerulean transition-colors"
                      title="Reset to original"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePoint(point.id)}
                    className="p-1.5 text-midnight/20 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
