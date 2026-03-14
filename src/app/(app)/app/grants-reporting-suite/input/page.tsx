"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import { ArrowRight, FileText } from "lucide-react";

const SOURCE_TYPES = [
  { value: "program", label: "Program data" },
  { value: "financial", label: "Financial data" },
  { value: "survey", label: "Survey results" },
  { value: "other", label: "Other" },
];

export default function InputPage() {
  const router = useRouter();
  const { rawData, setRawData, periodLabel, setPeriodLabel, sourceType, setSourceType } =
    useGrantsWizard();
  const [localData, setLocalData] = useState(rawData);
  const [localPeriod, setLocalPeriod] = useState(periodLabel);
  const [localSource, setLocalSource] = useState(sourceType || "program");

  function handleContinue() {
    setRawData(localData);
    setPeriodLabel(localPeriod);
    setSourceType(localSource);
    router.push("/app/grants-reporting-suite/analysis");
  }

  const canContinue = localData.trim().length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1
        className="text-2xl font-semibold text-midnight mb-1"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Input Your Data
      </h1>
      <p
        className="text-sm text-midnight/50 mb-6"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        Paste your raw program data, financial reports, or survey results below.
      </p>

      <div className="space-y-5">
        {/* Period label */}
        <div>
          <label
            className="block text-xs font-medium text-midnight/60 mb-1.5"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Reporting Period
          </label>
          <input
            type="text"
            value={localPeriod}
            onChange={(e) => setLocalPeriod(e.target.value)}
            placeholder="e.g. Q1 2026, FY 2025–2026"
            className="w-full px-3 py-2 border border-midnight/10 rounded-lg text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean bg-white"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          />
        </div>

        {/* Source type */}
        <div>
          <label
            className="block text-xs font-medium text-midnight/60 mb-1.5"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Source Type
          </label>
          <div className="flex gap-2 flex-wrap">
            {SOURCE_TYPES.map((st) => (
              <button
                key={st.value}
                onClick={() => setLocalSource(st.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  localSource === st.value
                    ? "bg-cerulean text-white border-cerulean"
                    : "bg-white text-midnight/50 border-midnight/10 hover:border-midnight/20"
                }`}
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Raw data textarea */}
        <div>
          <label
            className="block text-xs font-medium text-midnight/60 mb-1.5"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Raw Data
          </label>
          <div className="relative">
            <textarea
              value={localData}
              onChange={(e) => setLocalData(e.target.value)}
              placeholder="Paste your program data, financial reports, survey results, or any raw data here..."
              rows={16}
              className="w-full px-4 py-3 border border-midnight/10 rounded-xl text-sm text-midnight placeholder:text-midnight/20 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean bg-white resize-none"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            />
            {!localData && (
              <FileText className="absolute top-3 right-3 w-5 h-5 text-midnight/10" />
            )}
          </div>
          <p className="text-[11px] text-midnight/30 mt-1" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {localData.length.toLocaleString()} characters
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
