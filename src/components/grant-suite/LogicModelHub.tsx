"use client";

import { useState, useCallback, useRef } from "react";
import LogicModelGrid, { type LogicModelData, type SelectedCard } from "./LogicModelGrid";
import TheoryOfChange from "./TheoryOfChange";
import EvaluationPanel, { type EvaluationPlan } from "./EvaluationPanel";
import EmbedEvaluationInline from "./EmbedEvaluationInline";
import type { ReportingRow } from "./ReportingDashboard";

interface LogicModelHubProps {
  data: LogicModelData;
  logicModelId: string;
  initialEvaluationPlans: Record<string, EvaluationPlan>;
  initialReportingData: ReportingRow[];
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  readOnly?: boolean;
  embed?: boolean;
}

export default function LogicModelHub({
  data,
  logicModelId,
  initialEvaluationPlans,
  initialReportingData,
  programContext,
  readOnly = false,
  embed = false,
}: LogicModelHubProps) {
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [evaluationPlans, setEvaluationPlans] = useState<Record<string, EvaluationPlan>>(
    initialEvaluationPlans
  );
  const [reportingData, setReportingData] = useState<ReportingRow[]>(initialReportingData);
  const [loading, setLoading] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  // Use a ref for plans so the card click handler always has fresh data
  const plansRef = useRef(evaluationPlans);
  plansRef.current = evaluationPlans;

  const getPlanKey = (column: string, index: number) => `${column}_${index}`;

  function getCardData(column: string, index: number) {
    const items = data[column as keyof LogicModelData];
    if (!Array.isArray(items)) return { title: "" };
    return items[index] as Record<string, string>;
  }

  async function generatePlan(column: string, index: number) {
    setLoading(true);
    try {
      const cardData = getCardData(column, index);
      const res = await fetch("/api/grant-suite/generate-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logicModelId,
          cardColumn: column,
          cardIndex: index,
          cardData,
          programContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Evaluation generation failed:", err.error);
        return;
      }

      const plan = (await res.json()) as EvaluationPlan;
      const planKey = getPlanKey(column, index);
      setEvaluationPlans((prev) => ({ ...prev, [planKey]: plan }));
    } catch (err) {
      console.error("Evaluation generation error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCardClick(column: string, index: number) {
    // If clicking same card, deselect
    if (selectedCard?.column === column && selectedCard?.index === index) {
      setSelectedCard(null);
      setPanelVisible(false);
      return;
    }

    setSelectedCard({ column, index });
    setPanelVisible(true);

    const planKey = getPlanKey(column, index);

    // If plan already cached, no API call needed
    if (plansRef.current[planKey]) return;

    // In read-only mode, don't generate
    if (readOnly) return;

    // Generate evaluation plan
    await generatePlan(column, index);
  }

  function handleClose() {
    setSelectedCard(null);
    setPanelVisible(false);
  }

  async function refreshReportingData() {
    try {
      const res = await fetch(`/api/grant-suite/reporting-data?logicModelId=${logicModelId}`);
      if (res.ok) {
        const rows = await res.json();
        setReportingData(rows);
      }
    } catch (err) {
      console.error("Failed to refresh reporting data:", err);
    }
  }

  function handleNavigateToCard(column: string, index: number) {
    handleCardClick(column, index);
  }

  async function handleRegenerate() {
    if (!selectedCard) return;
    const planKey = getPlanKey(selectedCard.column, selectedCard.index);
    // Clear cached plan
    setEvaluationPlans((prev) => {
      const next = { ...prev };
      delete next[planKey];
      return next;
    });
    // Re-generate
    await generatePlan(selectedCard.column, selectedCard.index);
  }

  const currentPlanKey = selectedCard
    ? getPlanKey(selectedCard.column, selectedCard.index)
    : null;
  const currentPlan = currentPlanKey ? evaluationPlans[currentPlanKey] ?? null : null;

  return (
    <>
      {/* Logic model grid */}
      <LogicModelGrid
        data={data}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
      />

      {/* Theory of Change */}
      {data.theoryOfChange && <TheoryOfChange text={data.theoryOfChange} />}

      {/* Evaluation panel — embed uses inline accordion, regular uses floating panel */}
      {panelVisible && selectedCard && (
        embed ? (
          <EmbedEvaluationInline
            evaluationPlan={currentPlan}
            loading={loading}
            onClose={handleClose}
          />
        ) : (
          <EvaluationPanel
            selectedCard={selectedCard}
            data={data}
            evaluationPlan={currentPlan}
            loading={loading}
            onClose={handleClose}
            onRegenerate={readOnly ? undefined : handleRegenerate}
            readOnly={readOnly}
            logicModelId={logicModelId}
            programContext={programContext}
            reportingData={reportingData}
            onDataSaved={refreshReportingData}
            onNavigateToCard={handleNavigateToCard}
          />
        )
      )}
    </>
  );
}
