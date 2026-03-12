"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

const VERTICALS = [
  "Workforce development",
  "Affordable housing",
  "Mental health & substance use",
  "Early childhood education",
  "Food security",
  "Domestic violence services",
  "Youth development",
  "Immigrant & refugee services",
  "General nonprofit services",
] as const;

interface FormData {
  programName: string;
  orgName: string;
  population: string;
  vertical: string;
  activities: string;
  inputs: string;
  outcomes: string;
}

const EMPTY_FORM: FormData = {
  programName: "",
  orgName: "",
  population: "",
  vertical: "",
  activities: "",
  inputs: "",
  outcomes: "",
};

export default function NewLogicModelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-populate from query params (edit mode)
  const [form, setForm] = useState<FormData>(() => {
    const fromParams: Partial<FormData> = {};
    const keys: (keyof FormData)[] = ["programName", "orgName", "population", "vertical", "activities", "inputs", "outcomes"];
    keys.forEach((k) => {
      const val = searchParams.get(k);
      if (val) fromParams[k] = val;
    });
    return { ...EMPTY_FORM, ...fromParams };
  });

  const editId = searchParams.get("editId");
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePreFill() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/grant-suite/parse-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedText: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse");

      setForm((prev) => ({
        programName: data.programName || prev.programName,
        orgName: data.orgName || prev.orgName,
        population: data.population || prev.population,
        vertical: VERTICALS.includes(data.vertical) ? data.vertical : prev.vertical,
        activities: data.activities || prev.activities,
        inputs: data.inputs || prev.inputs,
        outcomes: data.outcomes || prev.outcomes,
      }));
      setShowPaste(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse text");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.programName || !form.population || !form.activities) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/grant-suite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, editId: editId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");

      router.push(`/app/grant-suite/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate logic model");
      setGenerating(false);
    }
  }

  const isValid = form.programName.trim() && form.population.trim() && form.activities.trim();

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-midnight px-8 py-6 border-b border-gold/20">
        <div className="max-w-2xl mx-auto">
          <a
            href="/app/grant-suite"
            className="inline-flex items-center gap-1 font-jost text-xs text-stone/50 hover:text-stone/70 transition-colors mb-3"
          >
            ← Back to Grant Suite
          </a>
          <p className="font-mono text-[10px] text-gold/50 uppercase tracking-[0.2em] mb-1">
            Grant Suite
          </p>
          <h1 className="font-fraunces text-2xl text-stone leading-none">
            {editId ? "Edit Logic Model" : "New Logic Model"}
          </h1>
        </div>
      </div>
      <div className="h-[3px] bg-gold" />

      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Paste pre-fill toggle */}
        <div className="bg-white rounded-xl border border-stone/60 mb-8 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPaste((s) => !s)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone/30 transition-colors"
          >
            <div>
              <p className="font-fraunces text-sm text-midnight font-medium">
                Have an existing grant application?
              </p>
              <p className="font-jost text-xs text-midnight/50 mt-0.5">
                Paste it here and we&apos;ll pre-fill the form
              </p>
            </div>
            {showPaste ? (
              <ChevronUp className="w-4 h-4 text-midnight/40 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-midnight/40 flex-shrink-0" />
            )}
          </button>

          {showPaste && (
            <div className="px-5 pb-5 border-t border-stone/40">
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your grant application narrative, program description, or any relevant text here…"
                className="form-textarea mt-4 text-sm"
              />
              <button
                type="button"
                onClick={handlePreFill}
                disabled={parsing || !pasteText.trim()}
                className="mt-3 inline-flex items-center gap-2 btn-secondary text-xs py-2"
              >
                {parsing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {parsing ? "Parsing…" : "Pre-fill form"}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Section 1: Program Information */}
          <section>
            <h2 className="font-fraunces text-lg text-midnight mb-5 pb-3 border-b border-stone/60">
              Program information
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="form-label" htmlFor="programName">
                  Program name <span className="text-error">*</span>
                </label>
                <input
                  id="programName"
                  type="text"
                  required
                  value={form.programName}
                  onChange={(e) => update("programName", e.target.value)}
                  className="form-input"
                  placeholder="e.g., WorkReady Pathways Program"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="orgName">
                  Organization name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={form.orgName}
                  onChange={(e) => update("orgName", e.target.value)}
                  className="form-input"
                  placeholder="e.g., Denver Community Action Network"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="population">
                  Target population <span className="text-error">*</span>
                </label>
                <input
                  id="population"
                  type="text"
                  required
                  value={form.population}
                  onChange={(e) => update("population", e.target.value)}
                  className="form-input"
                  placeholder="Who does this program serve? Be specific about demographics and geography."
                />
                <p className="font-jost text-xs text-midnight/40 mt-1.5">
                  Be specific — e.g., &quot;Unemployed adults 18–35 in Adams County
                  earning below 200% FPL&quot;
                </p>
              </div>

              <div>
                <label className="form-label" htmlFor="vertical">
                  Service vertical
                </label>
                <select
                  id="vertical"
                  value={form.vertical}
                  onChange={(e) => update("vertical", e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a vertical…</option>
                  {VERTICALS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Program Design */}
          <section>
            <h2 className="font-fraunces text-lg text-midnight mb-5 pb-3 border-b border-stone/60">
              Program design
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="form-label" htmlFor="activities">
                  Core activities &amp; services <span className="text-error">*</span>
                </label>
                <textarea
                  id="activities"
                  rows={4}
                  required
                  value={form.activities}
                  onChange={(e) => update("activities", e.target.value)}
                  className="form-textarea"
                  placeholder="What does the program actually do? Describe the main services, interventions, and activities."
                />
              </div>

              <div>
                <label className="form-label" htmlFor="inputs">
                  Key resources &amp; inputs
                </label>
                <textarea
                  id="inputs"
                  rows={3}
                  value={form.inputs}
                  onChange={(e) => update("inputs", e.target.value)}
                  className="form-textarea"
                  placeholder="Staff, funding sources, partnerships, facilities, equipment…"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="outcomes">
                  Desired outcomes
                </label>
                <textarea
                  id="outcomes"
                  rows={3}
                  value={form.outcomes}
                  onChange={(e) => update("outcomes", e.target.value)}
                  className="form-textarea"
                  placeholder="What change do you hope to see in participants? What does success look like?"
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm font-jost text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="pb-8">
            <button
              type="submit"
              disabled={generating || !isValid}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating logic model…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate logic model
                </>
              )}
            </button>
            <p className="text-center font-jost text-xs text-midnight/35 mt-3">
              Generation takes 10–20 seconds
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
