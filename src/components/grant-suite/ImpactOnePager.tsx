"use client";

import type { LogicModelData } from "./LogicModelGrid";

interface ImpactOnePagerProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
}

export default function ImpactOnePager({
  data,
  programContext,
}: ImpactOnePagerProps) {
  const outputs = data.outputs ?? [];
  const shortTerm = data.shortTermOutcomes ?? [];
  const longTerm = data.longTermOutcomes ?? [];

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      {/* Print-optimized single page */}
      <div className="bg-white rounded-xl border border-stone/40 shadow-sm overflow-hidden print:shadow-none print:border-none">
        {/* Header band */}
        <div className="bg-midnight px-8 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/70 mb-1">
            Impact Summary
          </p>
          <h2 className="font-fraunces text-2xl text-stone">
            {programContext.programName}
          </h2>
          <p className="font-jost text-xs text-stone/50 mt-1">
            {[programContext.vertical, programContext.population]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Gold accent */}
        <div className="h-[3px] bg-gold" />

        <div className="px-8 py-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {outputs.slice(0, 4).map((output, i) => (
              <div
                key={i}
                className="bg-[#fff7eb] rounded-lg p-4 text-center"
              >
                <p className="font-fraunces text-xl text-midnight font-semibold">
                  {output.target}
                </p>
                <p className="font-jost text-[11px] text-midnight/50 mt-1 leading-tight">
                  {output.metric}
                </p>
              </div>
            ))}
          </div>

          {/* Theory of Change */}
          <div
            className="mb-6 px-5 py-4 rounded-lg border border-stone/30"
            style={{ borderLeft: "4px solid #E9C03A" }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-midnight/40 mb-2">
              Theory of Change
            </p>
            <p className="font-fraunces italic text-sm text-midnight leading-relaxed">
              {data.theoryOfChange}
            </p>
          </div>

          {/* Two-column: What We Do / What Changes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Activities */}
            <div>
              <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-[#0F6E56] mb-3">
                What We Do
              </h3>
              <div className="space-y-2">
                {(data.activities ?? []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-jost text-sm font-semibold text-midnight leading-tight">
                        {item.title}
                      </p>
                      <p className="font-jost text-xs text-midnight/50">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div>
              <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-[#3C3489] mb-3">
                What Changes
              </h3>
              <div className="space-y-2">
                {shortTerm.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3C3489] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-jost text-sm font-semibold text-midnight leading-tight">
                        {item.title}
                      </p>
                      <p className="font-jost text-xs text-midnight/50">
                        {item.indicator}
                      </p>
                    </div>
                  </div>
                ))}
                {longTerm.slice(0, 2).map((item, i) => (
                  <div key={`lt-${i}`} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#993C1D] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-jost text-sm font-semibold text-midnight leading-tight">
                        {item.title}
                      </p>
                      <p className="font-jost text-xs text-midnight/50">
                        {item.indicator}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resources footer */}
          <div className="border-t border-stone/30 pt-4">
            <h3 className="font-jost font-semibold text-xs uppercase tracking-wider text-[#185FA5] mb-2">
              Key Resources
            </h3>
            <div className="flex flex-wrap gap-2">
              {(data.inputs ?? []).map((item, i) => (
                <span
                  key={i}
                  className="inline-block font-jost text-xs bg-[#f0f7ff] text-[#185FA5] px-3 py-1 rounded-full"
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
