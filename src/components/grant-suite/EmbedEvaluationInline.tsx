"use client";

import type { EvaluationPlan } from "./EvaluationPanel";

interface EmbedEvaluationInlineProps {
  evaluationPlan: EvaluationPlan | null;
  loading: boolean;
  onClose: () => void;
}

export default function EmbedEvaluationInline({
  evaluationPlan,
  loading,
  onClose,
}: EmbedEvaluationInlineProps) {
  if (loading) {
    return (
      <div className="mx-6 mb-4 rounded-lg bg-white border border-[#e5e7eb] p-4 text-center">
        <div
          className="w-5 h-5 border-2 border-[#3A6B8A] border-t-transparent rounded-full mx-auto mb-2"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="font-jost text-xs text-[#9ca3af]">Generating...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!evaluationPlan) {
    return (
      <div className="mx-6 mb-4 rounded-lg bg-white border border-[#e5e7eb] p-4 text-center">
        <p className="font-jost text-[11px] text-[#9ca3af]">
          Evaluation plan not yet generated
        </p>
        <button
          onClick={onClose}
          className="font-jost text-[10px] text-[#6b7280] hover:text-midnight mt-2 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      className="mx-6 mb-4 rounded-lg bg-white border border-[#e5e7eb] overflow-hidden"
      style={{ animation: "accordionOpen 0.2s ease" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#e5e7eb]">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#3A6B8A]">
          Evaluation Plan
        </p>
        <button
          onClick={onClose}
          className="text-[#9ca3af] hover:text-midnight transition-colors text-sm leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div>
          <Label>Indicator</Label>
          <p className="font-jost text-[11px] text-midnight leading-snug">
            {evaluationPlan.indicator}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Frequency</Label>
            <p className="font-jost text-[11px] text-midnight leading-snug">
              {evaluationPlan.frequency}
            </p>
          </div>
          <div>
            <Label>Data Source</Label>
            <p className="font-jost text-[11px] text-midnight leading-snug">
              {evaluationPlan.dataSource}
            </p>
          </div>
        </div>

        {evaluationPlan.funderLanguage && (
          <div
            className="rounded p-2 mt-1"
            style={{ backgroundColor: "#EDE8DE" }}
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#3A6B8A] mb-1 flex items-center gap-1">
              <span>✦</span> Funder language
            </p>
            <p className="font-jost text-[10px] text-midnight leading-[1.5] italic">
              {evaluationPlan.funderLanguage}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes accordionOpen {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#3A6B8A] mb-0.5">
      {children}
    </p>
  );
}
