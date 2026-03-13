"use client";

import { useState } from "react";
import type { LogicModelData } from "./LogicModelGrid";

interface GrantReportViewProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  logicModelId: string;
}

export default function GrantReportView({
  data,
  programContext,
  logicModelId,
}: GrantReportViewProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateNarrative() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/grant-suite/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logicModelId, programContext, data }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to generate narrative");
        return;
      }
      const result = await res.json();
      setNarrative(result.narrative);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-stone/40 pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-midnight/40 mb-1">
          Grant Report
        </p>
        <h2 className="font-fraunces text-2xl text-midnight mb-1">
          {programContext.programName}
        </h2>
        <p className="font-jost text-sm text-midnight/50">
          {[programContext.vertical, programContext.population]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Executive Summary */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full inline-block" />
          Executive Summary
        </h3>
        <div className="font-jost text-sm text-midnight/80 leading-relaxed bg-white rounded-lg border border-stone/40 p-5">
          <p>{data.theoryOfChange}</p>
        </div>
      </section>

      {/* Program Resources */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#185FA5] rounded-full inline-block" />
          Program Resources (Inputs)
        </h3>
        <div className="bg-white rounded-lg border border-stone/40 p-5 space-y-3">
          {(data.inputs ?? []).map((item, i) => (
            <div key={i}>
              <p className="font-jost font-semibold text-sm text-midnight">
                {item.title}
              </p>
              <p className="font-jost text-sm text-midnight/60">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Program Activities */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#0F6E56] rounded-full inline-block" />
          Program Activities
        </h3>
        <div className="bg-white rounded-lg border border-stone/40 p-5 space-y-3">
          {(data.activities ?? []).map((item, i) => (
            <div key={i}>
              <p className="font-jost font-semibold text-sm text-midnight">
                {item.title}
              </p>
              <p className="font-jost text-sm text-midnight/60">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Expected Outputs */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#854F0B] rounded-full inline-block" />
          Expected Outputs
        </h3>
        <div className="bg-white rounded-lg border border-stone/40 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fff7eb]">
                <th className="text-left font-jost font-semibold text-xs text-midnight/60 px-5 py-2.5">
                  Output
                </th>
                <th className="text-left font-jost font-semibold text-xs text-midnight/60 px-5 py-2.5">
                  Metric
                </th>
                <th className="text-left font-jost font-semibold text-xs text-midnight/60 px-5 py-2.5">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {(data.outputs ?? []).map((item, i) => (
                <tr key={i} className="border-t border-stone/20">
                  <td className="font-jost text-sm text-midnight px-5 py-3">
                    {item.title}
                  </td>
                  <td className="font-jost text-sm text-midnight/70 px-5 py-3">
                    {item.metric}
                  </td>
                  <td className="font-jost text-sm font-semibold text-midnight px-5 py-3">
                    {item.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outcomes */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#3C3489] rounded-full inline-block" />
          Short-Term Outcomes (0–12 months)
        </h3>
        <div className="bg-white rounded-lg border border-stone/40 p-5 space-y-3">
          {(data.shortTermOutcomes ?? []).map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-4">
              <div>
                <p className="font-jost font-semibold text-sm text-midnight">
                  {item.title}
                </p>
                <p className="font-jost text-sm text-midnight/60">
                  {item.indicator}
                </p>
              </div>
              <span className="font-mono text-[10px] text-midnight/40 whitespace-nowrap mt-0.5">
                {item.timeframe}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#993C1D] rounded-full inline-block" />
          Long-Term Outcomes (1–5 years)
        </h3>
        <div className="bg-white rounded-lg border border-stone/40 p-5 space-y-3">
          {(data.longTermOutcomes ?? []).map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-4">
              <div>
                <p className="font-jost font-semibold text-sm text-midnight">
                  {item.title}
                </p>
                <p className="font-jost text-sm text-midnight/60">
                  {item.indicator}
                </p>
              </div>
              <span className="font-mono text-[10px] text-midnight/40 whitespace-nowrap mt-0.5">
                {item.timeframe}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Narrative */}
      <section className="mb-8">
        <h3 className="font-fraunces text-lg text-midnight mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full inline-block" />
          Funder Narrative
        </h3>
        {narrative ? (
          <div className="bg-white rounded-lg border border-stone/40 p-5">
            <div className="font-jost text-sm text-midnight/80 leading-relaxed whitespace-pre-wrap">
              {narrative}
            </div>
            <button
              onClick={generateNarrative}
              disabled={loading}
              className="mt-4 font-jost text-xs text-cerulean hover:text-cerulean-dark transition-colors"
            >
              Regenerate narrative
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-dashed border-stone/60 p-8 text-center">
            <p className="font-jost text-sm text-midnight/50 mb-4">
              Generate a funder-ready narrative from your logic model data
            </p>
            {error && (
              <p className="font-jost text-xs text-red-500 mb-3">{error}</p>
            )}
            <button
              onClick={generateNarrative}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-midnight font-jost font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Narrative"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
