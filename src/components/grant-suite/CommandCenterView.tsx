"use client";

import { useState } from "react";
import type { LogicModelData } from "./LogicModelGrid";
import type { ReportingRow } from "./ReportingDashboard";

interface CommandCenterViewProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  reportingData: ReportingRow[];
}

export default function CommandCenterView({
  data,
  programContext,
  reportingData,
}: CommandCenterViewProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const outputs = data.outputs ?? [];
  const shortTerm = data.shortTermOutcomes ?? [];
  const longTerm = data.longTermOutcomes ?? [];
  const activities = data.activities ?? [];
  const inputs = data.inputs ?? [];

  // Latest reporting data per card
  const latestData: Record<string, ReportingRow> = {};
  for (const row of reportingData) {
    if (
      !latestData[row.card_key] ||
      new Date(row.updated_at ?? "") > new Date(latestData[row.card_key].updated_at ?? "")
    ) {
      latestData[row.card_key] = row;
    }
  }

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "outputs", label: "Outputs & Metrics" },
    { id: "outcomes", label: "Outcomes" },
    { id: "narrative", label: "Narrative" },
  ];

  return (
    <div className="min-h-full bg-midnight">
      {/* Command Center header */}
      <div className="px-8 py-5 border-b border-stone/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/60">
              Funder Command Center
            </p>
            <h2 className="font-fraunces text-xl text-stone mt-0.5">
              {programContext.programName}
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-stone/5 rounded-lg p-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`font-jost text-xs px-3 py-1.5 rounded-md transition-colors ${
                  activeSection === s.id
                    ? "bg-gold text-midnight font-semibold"
                    : "text-stone/50 hover:text-stone/80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-gold/30" />

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Key metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {outputs.slice(0, 4).map((output, i) => {
                const report = latestData[`outputs_${i}`];
                const current = report?.current_value ?? 0;
                const target = report?.target_value ?? 0;
                const pct = target > 0 ? Math.round((current / target) * 100) : 0;
                return (
                  <div
                    key={i}
                    className="bg-stone/5 border border-stone/10 rounded-xl p-5"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone/40 mb-1">
                      {output.metric}
                    </p>
                    <p className="font-fraunces text-2xl text-gold font-semibold">
                      {report ? current : output.target}
                    </p>
                    {report && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-stone/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="font-mono text-[9px] text-stone/30 mt-1">
                          {pct}% of target
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Theory of change */}
            <div className="bg-stone/5 border border-stone/10 rounded-xl p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold/60 mb-2">
                Theory of Change
              </p>
              <p className="font-fraunces italic text-sm text-stone/80 leading-relaxed">
                {data.theoryOfChange}
              </p>
            </div>

            {/* Activities + Inputs side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-stone/5 border border-stone/10 rounded-xl p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone/40 mb-3">
                  Core Activities
                </p>
                <div className="space-y-2">
                  {activities.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-jost text-sm text-stone font-semibold">
                          {item.title}
                        </p>
                        <p className="font-jost text-xs text-stone/40">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-stone/5 border border-stone/10 rounded-xl p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone/40 mb-3">
                  Resources
                </p>
                <div className="space-y-2">
                  {inputs.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-jost text-sm text-stone font-semibold">
                          {item.title}
                        </p>
                        <p className="font-jost text-xs text-stone/40">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Outputs & Metrics ────────────────────────────────────────────── */}
        {activeSection === "outputs" && (
          <div className="space-y-4">
            {outputs.map((output, i) => {
              const report = latestData[`outputs_${i}`];
              const current = report?.current_value ?? 0;
              const target = report?.target_value ?? 0;
              const pct = target > 0 ? Math.round((current / target) * 100) : 0;
              return (
                <div
                  key={i}
                  className="bg-stone/5 border border-stone/10 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-jost text-base text-stone font-semibold">
                        {output.title}
                      </p>
                      <p className="font-jost text-xs text-stone/40">
                        Metric: {output.metric}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-fraunces text-xl text-gold font-semibold">
                        {report ? current : "—"}
                      </p>
                      <p className="font-mono text-[10px] text-stone/30">
                        Target: {output.target}
                      </p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-stone/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-gold"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {report?.notes && (
                    <p className="font-jost text-xs text-stone/40 mt-2 italic">
                      {report.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Outcomes ─────────────────────────────────────────────────────── */}
        {activeSection === "outcomes" && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone/40 mb-3">
                Short-Term Outcomes (0–12 months)
              </p>
              <div className="space-y-3">
                {shortTerm.map((item, i) => (
                  <div
                    key={i}
                    className="bg-stone/5 border border-stone/10 rounded-xl p-5 flex items-start justify-between"
                  >
                    <div>
                      <p className="font-jost text-sm text-stone font-semibold">
                        {item.title}
                      </p>
                      <p className="font-jost text-xs text-stone/40">
                        {item.indicator}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-stone/30 bg-stone/5 px-2 py-0.5 rounded">
                      {item.timeframe}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone/40 mb-3">
                Long-Term Outcomes (1–5 years)
              </p>
              <div className="space-y-3">
                {longTerm.map((item, i) => (
                  <div
                    key={i}
                    className="bg-stone/5 border border-stone/10 rounded-xl p-5 flex items-start justify-between"
                  >
                    <div>
                      <p className="font-jost text-sm text-stone font-semibold">
                        {item.title}
                      </p>
                      <p className="font-jost text-xs text-stone/40">
                        {item.indicator}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-stone/30 bg-stone/5 px-2 py-0.5 rounded">
                      {item.timeframe}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Narrative ────────────────────────────────────────────────────── */}
        {activeSection === "narrative" && (
          <div className="space-y-6">
            <div className="bg-stone/5 border border-stone/10 rounded-xl p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold/60 mb-4">
                Program Narrative
              </p>
              <h3 className="font-fraunces text-xl text-stone mb-4">
                {programContext.programName}
              </h3>
              <div className="font-jost text-sm text-stone/70 leading-relaxed space-y-4">
                <p>
                  <span className="font-semibold text-stone">Program Overview:</span>{" "}
                  {data.theoryOfChange}
                </p>
                <p>
                  <span className="font-semibold text-stone">Target Population:</span>{" "}
                  {programContext.population || "Not specified"}
                </p>
                <p>
                  <span className="font-semibold text-stone">Service Area:</span>{" "}
                  {programContext.vertical || "General nonprofit services"}
                </p>
                <p>
                  <span className="font-semibold text-stone">Core Activities:</span>{" "}
                  {activities.map((a) => a.title).join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-stone">Key Outputs:</span>{" "}
                  {outputs
                    .map((o) => `${o.title} (${o.target})`)
                    .join("; ")}
                </p>
                <p>
                  <span className="font-semibold text-stone">Expected Short-Term Outcomes:</span>{" "}
                  {shortTerm.map((o) => o.title).join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-stone">Long-Term Vision:</span>{" "}
                  {longTerm.map((o) => `${o.title} (${o.timeframe})`).join("; ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
