"use client";

import type { LogicModelData } from "./LogicModelGrid";
import type { ReportingRow } from "./ReportingDashboard";

interface StaffDashboardViewProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  reportingData: ReportingRow[];
}

function getProgressColor(pct: number): string {
  if (pct >= 90) return "#16a34a";
  if (pct >= 70) return "#d97706";
  if (pct >= 50) return "#ea580c";
  return "#dc2626";
}

function getStatusLabel(pct: number): string {
  if (pct >= 90) return "On Track";
  if (pct >= 70) return "Progressing";
  if (pct >= 50) return "Needs Attention";
  return "At Risk";
}

export default function StaffDashboardView({
  data,
  programContext,
  reportingData,
}: StaffDashboardViewProps) {
  const outputs = data.outputs ?? [];
  const shortTerm = data.shortTermOutcomes ?? [];

  // Build a map of latest reporting data per card key
  const latestData: Record<string, ReportingRow> = {};
  for (const row of reportingData) {
    if (
      !latestData[row.card_key] ||
      new Date(row.updated_at ?? "") > new Date(latestData[row.card_key].updated_at ?? "")
    ) {
      latestData[row.card_key] = row;
    }
  }

  // Calculate overall progress
  const trackedOutputs = outputs.map((output, i) => {
    const key = `outputs_${i}`;
    const report = latestData[key];
    const target = report?.target_value ?? 0;
    const current = report?.current_value ?? 0;
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    return { ...output, current, target: target || 0, pct, report, key };
  });

  const avgProgress =
    trackedOutputs.length > 0
      ? Math.round(
          trackedOutputs.reduce((sum, o) => sum + o.pct, 0) /
            trackedOutputs.length
        )
      : 0;

  const hasData = reportingData.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Dashboard header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-midnight/40 mb-1">
            Staff Dashboard
          </p>
          <h2 className="font-fraunces text-2xl text-midnight">
            {programContext.programName}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-midnight/30">
            Internal View
          </p>
          <span className="inline-block bg-blue-50 text-blue-700 font-mono text-[10px] px-2 py-0.5 rounded-full mt-1">
            Staff Only
          </span>
        </div>
      </div>

      {/* Overall progress card */}
      <div className="bg-white rounded-xl border border-stone/40 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-jost font-semibold text-sm text-midnight">
            Overall Progress
          </p>
          {hasData ? (
            <span
              className="font-mono text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${getProgressColor(avgProgress)}15`,
                color: getProgressColor(avgProgress),
              }}
            >
              {getStatusLabel(avgProgress)}
            </span>
          ) : (
            <span className="font-mono text-xs text-midnight/30 bg-stone/30 px-2 py-0.5 rounded-full">
              No data entered
            </span>
          )}
        </div>
        {hasData ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-stone/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(avgProgress, 100)}%`,
                    backgroundColor: getProgressColor(avgProgress),
                  }}
                />
              </div>
              <span className="font-fraunces text-lg font-semibold text-midnight">
                {avgProgress}%
              </span>
            </div>
          </div>
        ) : (
          <p className="font-jost text-sm text-midnight/40">
            Click on logic model cards to enter reporting data and track
            progress against targets.
          </p>
        )}
      </div>

      {/* Output tracking grid */}
      <div className="mb-8">
        <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-midnight/50 mb-3">
          Output Tracking
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {trackedOutputs.map((output, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-stone/40 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-jost font-semibold text-sm text-midnight">
                  {output.title}
                </p>
                {output.report ? (
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getProgressColor(output.pct)}15`,
                      color: getProgressColor(output.pct),
                    }}
                  >
                    {output.pct}%
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-midnight/20">
                    —
                  </span>
                )}
              </div>
              <p className="font-jost text-xs text-midnight/40 mb-2">
                {output.metric}
              </p>
              <div className="h-2 bg-stone/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(output.pct, 100)}%`,
                    backgroundColor: output.report
                      ? getProgressColor(output.pct)
                      : "#d1d5db",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="font-mono text-[10px] text-midnight/30">
                  {output.report ? output.current : "—"} current
                </span>
                <span className="font-mono text-[10px] text-midnight/30">
                  {output.target || output.target} target
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Short-term outcomes checklist */}
      <div className="mb-8">
        <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-midnight/50 mb-3">
          Short-Term Outcome Indicators
        </h3>
        <div className="bg-white rounded-xl border border-stone/40 shadow-sm divide-y divide-stone/20">
          {shortTerm.map((outcome, i) => {
            const key = `shortTermOutcomes_${i}`;
            const report = latestData[key];
            return (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: report ? "#16a34a" : "#d1d5db",
                    backgroundColor: report ? "#16a34a" : "transparent",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-jost text-sm text-midnight font-semibold">
                    {outcome.title}
                  </p>
                  <p className="font-jost text-xs text-midnight/50">
                    {outcome.indicator}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-midnight/30 flex-shrink-0">
                  {outcome.timeframe}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource summary */}
      <div>
        <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-midnight/50 mb-3">
          Resources Allocated
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.inputs ?? []).map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-stone/40 px-4 py-2 shadow-sm"
            >
              <p className="font-jost text-sm font-semibold text-midnight">
                {item.title}
              </p>
              <p className="font-jost text-xs text-midnight/40">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
