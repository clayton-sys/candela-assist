"use client";

import type { DataPoint } from "@/app/(app)/app/grants-reporting-suite/context/GrantsWizardContext";

interface DataPointChipsProps {
  category: string;
  label: string;
  points: DataPoint[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export default function DataPointChips({
  category,
  label,
  points,
  onToggle,
  onToggleAll,
}: DataPointChipsProps) {
  const allSelected = points.every((p) => p.selected);
  const selectedCount = points.filter((p) => p.selected).length;

  return (
    <div className="bg-white rounded-xl border border-midnight/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold text-midnight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {label}
          <span className="ml-2 text-xs font-normal text-midnight/30">
            {selectedCount}/{points.length}
          </span>
        </h3>
        <button
          onClick={onToggleAll}
          className="text-[11px] text-cerulean hover:text-cerulean-dark transition-colors"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {points.map((point) => (
          <button
            key={point.id}
            onClick={() => onToggle(point.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              point.selected
                ? "bg-cerulean/10 text-cerulean border-cerulean/20"
                : "bg-midnight/[0.02] text-midnight/30 border-midnight/5 hover:border-midnight/15"
            }`}
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <span className="font-semibold">{point.label}</span>
            <span className="ml-1.5 opacity-70">{point.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
