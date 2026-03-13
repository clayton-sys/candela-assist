"use client";

import type { LogicModelData } from "./LogicModelGrid";

interface FunderPublicViewProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
}

export default function FunderPublicView({
  data,
  programContext,
}: FunderPublicViewProps) {
  const outputs = data.outputs ?? [];
  const shortTerm = data.shortTermOutcomes ?? [];
  const longTerm = data.longTermOutcomes ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-midnight/30 mb-2">
          Impact Report
        </p>
        <h2 className="font-fraunces text-3xl text-midnight mb-2">
          {programContext.programName}
        </h2>
        <p className="font-jost text-sm text-midnight/50">
          {[programContext.vertical, `Serving ${programContext.population}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Impact numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {outputs.slice(0, 4).map((output, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-stone/40 p-5 text-center shadow-sm"
          >
            <p className="font-fraunces text-2xl text-midnight font-semibold">
              {output.target}
            </p>
            <p className="font-jost text-xs text-midnight/40 mt-1">
              {output.metric}
            </p>
          </div>
        ))}
      </div>

      {/* Mission Statement */}
      <div className="bg-midnight rounded-xl p-8 mb-10 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold/60 mb-3">
          Our Mission
        </p>
        <p className="font-fraunces italic text-lg text-stone leading-relaxed max-w-xl mx-auto">
          &ldquo;{data.theoryOfChange}&rdquo;
        </p>
      </div>

      {/* How it works */}
      <div className="mb-10">
        <h3 className="font-fraunces text-xl text-midnight text-center mb-6">
          How It Works
        </h3>

        {/* Flow: Inputs → Activities → Outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Resources */}
          <div className="bg-[#f0f7ff] rounded-xl p-5">
            <p className="font-jost font-semibold text-xs uppercase tracking-wider text-[#185FA5] mb-3">
              We Invest
            </p>
            <div className="space-y-2">
              {(data.inputs ?? []).map((item, i) => (
                <div key={i}>
                  <p className="font-jost text-sm font-semibold text-midnight">
                    {item.title}
                  </p>
                  <p className="font-jost text-xs text-midnight/50">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="bg-[#eafaf3] rounded-xl p-5">
            <p className="font-jost font-semibold text-xs uppercase tracking-wider text-[#0F6E56] mb-3">
              We Deliver
            </p>
            <div className="space-y-2">
              {(data.activities ?? []).map((item, i) => (
                <div key={i}>
                  <p className="font-jost text-sm font-semibold text-midnight">
                    {item.title}
                  </p>
                  <p className="font-jost text-xs text-midnight/50">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#f3f2fe] rounded-xl p-5">
            <p className="font-jost font-semibold text-xs uppercase tracking-wider text-[#3C3489] mb-3">
              We Achieve
            </p>
            <div className="space-y-2">
              {shortTerm.map((item, i) => (
                <div key={i}>
                  <p className="font-jost text-sm font-semibold text-midnight">
                    {item.title}
                  </p>
                  <p className="font-jost text-xs text-midnight/50">
                    {item.indicator}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Long-term vision */}
      <div className="mb-8">
        <h3 className="font-fraunces text-xl text-midnight text-center mb-6">
          Long-Term Impact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {longTerm.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-stone/40 p-5 text-center shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-[#fff0eb] flex items-center justify-center mx-auto mb-3">
                <span className="font-fraunces text-sm text-[#993C1D] font-semibold">
                  {i + 1}
                </span>
              </div>
              <p className="font-jost font-semibold text-sm text-midnight mb-1">
                {item.title}
              </p>
              <p className="font-jost text-xs text-midnight/50">
                {item.indicator}
              </p>
              <p className="font-mono text-[9px] text-midnight/30 mt-2">
                {item.timeframe}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
