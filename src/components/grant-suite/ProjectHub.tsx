"use client";

import { useState } from "react";
import type { LogicModelData } from "./LogicModelGrid";
import type { EvaluationPlan } from "./EvaluationPanel";
import type { ReportingRow } from "./ReportingDashboard";
import LogicModelHub from "./LogicModelHub";
import GrantReportView from "./GrantReportView";
import ImpactOnePager from "./ImpactOnePager";
import BoardDeckSlide from "./BoardDeckSlide";
import FunderPublicView from "./FunderPublicView";
import StaffDashboardView from "./StaffDashboardView";
import CommandCenterView from "./CommandCenterView";
import WebsiteEmbedPreview from "./WebsiteEmbedPreview";

// ─── View config ────────────────────────────────────────────────────────────

interface ViewTab {
  id: string;
  label: string;
  icon: string;
}

const ALL_VIEWS: ViewTab[] = [
  { id: "logic_model", label: "Logic Model", icon: "📊" },
  { id: "command_center", label: "Command Center", icon: "🎯" },
  { id: "staff_dashboard", label: "Staff Dashboard", icon: "📋" },
  { id: "funder_public", label: "Funder View", icon: "🤝" },
  { id: "board_deck", label: "Board Deck", icon: "📽" },
  { id: "website_embed", label: "Embed Widget", icon: "🌐" },
  { id: "grant_report", label: "Grant Report", icon: "📝" },
  { id: "impact_one_pager", label: "One-Pager", icon: "📄" },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProjectHubProps {
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
  selectedViews: string[];
  shareUrl: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProjectHub({
  data,
  logicModelId,
  initialEvaluationPlans,
  initialReportingData,
  programContext,
  selectedViews,
  shareUrl,
}: ProjectHubProps) {
  // Determine which tabs to show — always include logic_model, plus whatever user selected
  const viewIds = Array.from(
    new Set(["logic_model", ...selectedViews])
  );
  const tabs = viewIds
    .map((id) => ALL_VIEWS.find((v) => v.id === id))
    .filter(Boolean) as ViewTab[];

  const [activeView, setActiveView] = useState(tabs[0]?.id ?? "logic_model");

  return (
    <div>
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="bg-white border-b border-stone/40 px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 font-jost text-xs whitespace-nowrap px-4 py-3 border-b-2 transition-colors ${
                  activeView === tab.id
                    ? "border-gold text-midnight font-semibold"
                    : "border-transparent text-midnight/40 hover:text-midnight/70"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View content */}
      <div>
        {activeView === "logic_model" && (
          <LogicModelHub
            data={data}
            logicModelId={logicModelId}
            initialEvaluationPlans={initialEvaluationPlans}
            initialReportingData={initialReportingData}
            programContext={programContext}
          />
        )}

        {activeView === "grant_report" && (
          <GrantReportView
            data={data}
            programContext={programContext}
            logicModelId={logicModelId}
          />
        )}

        {activeView === "impact_one_pager" && (
          <ImpactOnePager data={data} programContext={programContext} />
        )}

        {activeView === "board_deck" && (
          <BoardDeckSlide data={data} programContext={programContext} />
        )}

        {activeView === "funder_public" && (
          <FunderPublicView data={data} programContext={programContext} />
        )}

        {activeView === "staff_dashboard" && (
          <StaffDashboardView
            data={data}
            programContext={programContext}
            reportingData={initialReportingData}
          />
        )}

        {activeView === "command_center" && (
          <CommandCenterView
            data={data}
            programContext={programContext}
            reportingData={initialReportingData}
          />
        )}

        {activeView === "website_embed" && (
          <WebsiteEmbedPreview
            data={data}
            programContext={programContext}
            shareUrl={shareUrl}
          />
        )}
      </div>
    </div>
  );
}
