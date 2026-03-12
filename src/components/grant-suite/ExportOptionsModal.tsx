"use client";

import { useState } from "react";
import { Download, Loader2, X } from "lucide-react";

interface ExportOptionsModalProps {
  logicModelId: string;
  programName: string;
  hasEvaluationPlans: boolean;
  hasReportingData: boolean;
}

export default function ExportOptionsModal({
  logicModelId,
  programName,
  hasEvaluationPlans,
  hasReportingData,
}: ExportOptionsModalProps) {
  const [open, setOpen] = useState(false);
  const [includeLm, setIncludeLm] = useState(true);
  const [includeEval, setIncludeEval] = useState(hasEvaluationPlans);
  const [includeReporting, setIncludeReporting] = useState(hasReportingData);

  function handleExport() {
    const sections: string[] = [];
    if (includeLm) sections.push("lm");
    if (includeEval) sections.push("eval");
    if (includeReporting) sections.push("reporting");
    if (sections.length === 0) sections.push("lm");

    const url = `/app/grant-suite/${logicModelId}/print?sections=${sections.join(",")}`;
    window.open(url, "_blank");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 font-jost font-semibold text-xs text-stone/70 hover:text-stone border border-stone/20 hover:border-stone/40 px-3 py-2 rounded-lg transition-colors print-hidden"
      >
        <Download className="w-3.5 h-3.5" />
        Export PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-midnight/60"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div style={{ height: "3px", backgroundColor: "#E9C03A" }} />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-fraunces text-base text-midnight">
                  Export PDF
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#9ca3af] hover:text-midnight transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="font-jost text-xs text-[#6b7280] mb-4">
                Choose which sections to include in your export for{" "}
                <span className="font-medium text-midnight">{programName}</span>.
              </p>

              <div className="flex flex-col gap-3 mb-5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLm}
                    onChange={(e) => setIncludeLm(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e5e7eb] text-cerulean focus:ring-gold/50"
                  />
                  <span className="font-jost text-sm text-midnight">
                    Logic Model Grid
                  </span>
                </label>

                {hasEvaluationPlans && (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEval}
                      onChange={(e) => setIncludeEval(e.target.checked)}
                      className="w-4 h-4 rounded border-[#e5e7eb] text-cerulean focus:ring-gold/50"
                    />
                    <span className="font-jost text-sm text-midnight">
                      Evaluation Plans
                    </span>
                  </label>
                )}

                {hasReportingData && (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReporting}
                      onChange={(e) => setIncludeReporting(e.target.checked)}
                      className="w-4 h-4 rounded border-[#e5e7eb] text-cerulean focus:ring-gold/50"
                    />
                    <span className="font-jost text-sm text-midnight">
                      Reporting Dashboard
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 inline-flex items-center justify-center gap-2 font-jost font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
                  style={{ backgroundColor: "#E9C03A", color: "#1B2B3A" }}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="font-jost text-sm text-[#6b7280] hover:text-midnight transition-colors px-3 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
