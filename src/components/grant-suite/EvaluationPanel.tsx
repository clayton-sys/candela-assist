"use client";

import { useState, useRef, useEffect } from "react";
import { COLUMNS, type LogicModelData, type SelectedCard } from "./LogicModelGrid";
import ReportingDashboard, { type ReportingRow } from "./ReportingDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationPlan {
  indicator: string;
  frequency: string;
  dataSource: string;
  responsibleParty: string;
  collectionMethods: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
  funderLanguage: string;
  reportingNotes: string;
  generatedAt?: string;
}

interface EvaluationPanelProps {
  selectedCard: SelectedCard;
  data: LogicModelData;
  evaluationPlan: EvaluationPlan | null;
  loading: boolean;
  onClose: () => void;
  onRegenerate?: () => void;
  readOnly?: boolean;
  logicModelId: string;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  reportingData: ReportingRow[];
  onDataSaved: () => void;
  onNavigateToCard?: (column: string, index: number) => void;
}

// ─── Panel component ──────────────────────────────────────────────────────────

export default function EvaluationPanel({
  selectedCard,
  data,
  evaluationPlan,
  loading,
  onClose,
  onRegenerate,
  readOnly = false,
  logicModelId,
  programContext,
  reportingData,
  onDataSaved,
  onNavigateToCard,
}: EvaluationPanelProps) {
  const [activeTab, setActiveTab] = useState<"evaluation" | "reporting">("evaluation");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get column config
  const colConfig = COLUMNS.find((c) => c.key === selectedCard.column);
  const accent = colConfig?.accent ?? "#1B2B3A";
  const columnLabel = colConfig?.label ?? selectedCard.column;

  // Get card data
  const items = data[selectedCard.column as keyof LogicModelData];
  const cardItem = Array.isArray(items)
    ? (items[selectedCard.index] as Record<string, string>)
    : null;
  const cardTitle = cardItem?.title ?? "Untitled";

  // Reset tab on card change
  useEffect(() => {
    setActiveTab("evaluation");
  }, [selectedCard.column, selectedCard.index]);

  // Scroll panel into view
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedCard.column, selectedCard.index]);

  function handleCopy() {
    if (!evaluationPlan?.funderLanguage) return;
    navigator.clipboard.writeText(evaluationPlan.funderLanguage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      ref={panelRef}
      className="sm:mx-6 sm:mb-6 fixed sm:relative bottom-0 inset-x-0 sm:inset-auto z-40 sm:z-auto max-h-[70vh] sm:max-h-none overflow-y-auto"
      style={{ animation: "panelSlideIn 0.2s ease" }}
    >
      <div
        className="bg-white overflow-hidden"
        style={{
          border: `1px solid ${accent}`,
          borderRadius: "10px",
        }}
      >
        {/* 3px color bar */}
        <div style={{ height: "3px", backgroundColor: accent }} />

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-jost font-medium text-sm text-midnight truncate">
              {cardTitle}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: accent, backgroundColor: `${accent}10` }}>
              {columnLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-midnight transition-colors text-lg leading-none font-light flex-shrink-0 ml-3"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* Tab row */}
        <div className="px-4 flex gap-4 border-b border-[#e5e7eb]">
          <button
            onClick={() => setActiveTab("evaluation")}
            className="font-jost text-xs py-2.5 border-b-2 transition-colors"
            style={{
              borderColor: activeTab === "evaluation" ? "#3A6B8A" : "transparent",
              color: activeTab === "evaluation" ? "#1B2B3A" : "#9ca3af",
            }}
          >
            Evaluation Plan
          </button>
          <button
            onClick={() => setActiveTab("reporting")}
            className="font-jost text-xs py-2.5 border-b-2 transition-colors"
            style={{
              borderColor: activeTab === "reporting" ? "#3A6B8A" : "transparent",
              color: activeTab === "reporting" ? "#1B2B3A" : "#9ca3af",
            }}
          >
            Reporting Dashboard
          </button>
        </div>

        {/* Panel body */}
        <div className="p-4">
          {activeTab === "evaluation" ? (
            loading ? (
              <LoadingState />
            ) : evaluationPlan ? (
              <EvaluationPlanContent
                plan={evaluationPlan}
                onCopy={readOnly ? undefined : handleCopy}
                copied={copied}
                onRegenerate={readOnly ? undefined : onRegenerate}
              />
            ) : readOnly ? (
              <div className="text-center py-8">
                <p className="font-jost text-sm text-[#9ca3af]">
                  Evaluation plan not yet generated
                </p>
              </div>
            ) : null
          ) : (
            <ReportingDashboard
              selectedCard={selectedCard}
              data={data}
              logicModelId={logicModelId}
              programContext={programContext}
              reportingData={reportingData}
              onDataSaved={onDataSaved}
              readOnly={readOnly}
              onNavigateToCard={onNavigateToCard}
            />
          )}
        </div>
      </div>

      {/* Panel animation keyframe */}
      <style>{`
        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div
        className="w-6 h-6 border-2 border-[#3A6B8A] border-t-transparent rounded-full"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
      <p className="font-jost text-xs text-[#9ca3af]">
        Generating evaluation plan...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Evaluation Plan content ──────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "#3A6B8A" }}>
      {children}
    </p>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-jost text-[13px] text-midnight leading-[1.5]">
      {children}
    </p>
  );
}

function EvaluationPlanContent({
  plan,
  onCopy,
  copied,
  onRegenerate,
}: {
  plan: EvaluationPlan;
  onCopy?: () => void;
  copied: boolean;
  onRegenerate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Indicator — full width */}
      <div>
        <FieldLabel>Indicator</FieldLabel>
        <FieldValue>{plan.indicator}</FieldValue>
      </div>

      {/* 2-col grid: frequency + data source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Measurement Frequency</FieldLabel>
          <FieldValue>{plan.frequency}</FieldValue>
        </div>
        <div>
          <FieldLabel>Data Source</FieldLabel>
          <FieldValue>{plan.dataSource}</FieldValue>
        </div>
      </div>

      {/* Responsible party */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Responsible Party</FieldLabel>
          <FieldValue>{plan.responsibleParty}</FieldValue>
        </div>
      </div>

      {/* Collection methods */}
      {plan.collectionMethods?.length > 0 && (
        <div>
          <FieldLabel>Collection Methods</FieldLabel>
          <div className="flex flex-col">
            {plan.collectionMethods.map((method, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5"
                style={{
                  borderBottom:
                    i < plan.collectionMethods.length - 1
                      ? "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm"
                  style={{ backgroundColor: "#EDE8DE" }}
                >
                  {method.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-jost text-xs font-medium text-midnight">
                    {method.name}
                  </p>
                  <p className="font-jost text-[11px] text-[#9ca3af] leading-snug">
                    {method.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI funder language box */}
      <div>
        <div
          className="relative rounded-lg p-3"
          style={{ backgroundColor: "#EDE8DE" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1" style={{ color: "#3A6B8A" }}>
              <span>✦</span> AI-generated funder language
            </p>
            {onCopy && (
              <button
                onClick={onCopy}
                className="font-jost text-[10px] text-[#3A6B8A] hover:text-midnight transition-colors px-2 py-0.5 rounded border border-[#3A6B8A]/20 hover:border-[#3A6B8A]/40"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <p className="font-jost text-[13px] text-midnight leading-[1.65] italic">
            {plan.funderLanguage}
          </p>
          {plan.generatedAt && (
            <p className="font-jost text-[10px] text-[#9ca3af] mt-2">
              Generated {new Date(plan.generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Staff note */}
      {plan.reportingNotes && (
        <div>
          <p className="font-jost text-[11px] text-[#9ca3af] italic">
            <span className="font-medium not-italic">Staff note:</span>{" "}
            {plan.reportingNotes}
          </p>
        </div>
      )}

      {/* Regenerate button */}
      {onRegenerate && (
        <div>
          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 font-jost text-xs text-[#6b7280] hover:text-midnight border border-[#e5e7eb] hover:border-[#9ca3af] px-3 py-1.5 rounded-md transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

