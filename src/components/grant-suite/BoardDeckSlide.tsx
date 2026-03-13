"use client";

import type { LogicModelData } from "./LogicModelGrid";

interface BoardDeckSlideProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
}

export default function BoardDeckSlide({
  data,
  programContext,
}: BoardDeckSlideProps) {
  const outputs = data.outputs ?? [];
  const shortTerm = data.shortTermOutcomes ?? [];
  const longTerm = data.longTermOutcomes ?? [];

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8">
      {/* 16:9 aspect ratio slide */}
      <div
        className="bg-midnight rounded-xl overflow-hidden shadow-lg"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div className="h-full flex flex-col p-8 sm:p-10">
          {/* Slide header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/60">
                Program Impact
              </p>
              <h2 className="font-fraunces text-xl sm:text-2xl text-stone mt-0.5">
                {programContext.programName}
              </h2>
            </div>
            <div className="text-right">
              <p className="font-jost text-[10px] text-stone/40">
                {programContext.vertical}
              </p>
            </div>
          </div>

          {/* Gold divider */}
          <div className="h-[2px] bg-gold/40 mb-6" />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {outputs.slice(0, 4).map((output, i) => (
              <div
                key={i}
                className="bg-stone/5 border border-stone/10 rounded-lg p-3 text-center"
              >
                <p className="font-fraunces text-lg sm:text-xl text-gold font-semibold">
                  {output.target}
                </p>
                <p className="font-jost text-[10px] text-stone/50 mt-0.5 leading-tight">
                  {output.metric}
                </p>
              </div>
            ))}
          </div>

          {/* Two-column content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Key Activities */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone/40 mb-2">
                Key Activities
              </p>
              <div className="space-y-1.5">
                {(data.activities ?? []).slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                    <p className="font-jost text-xs text-stone/80 leading-tight">
                      <span className="font-semibold text-stone">
                        {item.title}
                      </span>{" "}
                      — {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone/40 mb-2">
                Expected Outcomes
              </p>
              <div className="space-y-1.5">
                {shortTerm.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#3C3489] mt-1.5 flex-shrink-0" />
                    <p className="font-jost text-xs text-stone/80 leading-tight">
                      <span className="font-semibold text-stone">
                        {item.title}
                      </span>{" "}
                      — {item.indicator}
                    </p>
                  </div>
                ))}
                {longTerm.slice(0, 2).map((item, i) => (
                  <div key={`lt-${i}`} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#993C1D] mt-1.5 flex-shrink-0" />
                    <p className="font-jost text-xs text-stone/80 leading-tight">
                      <span className="font-semibold text-stone">
                        {item.title}
                      </span>{" "}
                      — {item.indicator}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Theory of change footer */}
          <div className="mt-auto pt-4 border-t border-stone/10">
            <p className="font-fraunces italic text-xs text-stone/50 leading-relaxed line-clamp-2">
              &ldquo;{data.theoryOfChange}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Copy hint */}
      <p className="font-jost text-xs text-midnight/30 text-center mt-4">
        Right-click the slide above to copy or screenshot for your presentation
      </p>
    </div>
  );
}
