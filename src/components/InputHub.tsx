"use client";

import { useState } from "react";
import { DOCUMENT_TYPES, DocumentTypeId } from "@/lib/documentTypes";
import DictationButton from "./DictationButton";
import TranscriptReview from "./TranscriptReview";

type HubView = "input" | "review" | "output";

export default function InputHub() {
  const [docTypeId, setDocTypeId] = useState<DocumentTypeId>("progress-note");
  const [rawText, setRawText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [view, setView] = useState<HubView>("input");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === docTypeId)!;
  const hasInputContent = rawText.trim().length > 0;

  // Called when DictationButton returns a transcript — moves to review step
  const handleTranscriptReady = (t: string) => {
    setTranscript(t);
    setView("review");
  };

  const handleProcess = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "raw",
          documentTypeId: docTypeId,
          rawInput: textToProcess,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setOutput(data.draft);
      setView("output");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessFromInput = () => handleProcess(rawText);
  const handleProcessFromReview = () => handleProcess(transcript);

  const handleRerecord = () => {
    setTranscript("");
    setView("input");
  };

  const handleNewNote = () => {
    setRawText("");
    setTranscript("");
    setOutput("");
    setError("");
    setCopied(false);
    setView("input");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ── Privacy notice ── */}
      <div className="flex gap-3 rounded-r-xl border-l-4 border-cerulean bg-cerulean/10 p-4">
        <svg
          className="w-4 h-4 text-cerulean flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="font-jost text-sm text-midnight/80 leading-[1.7]">
          <strong className="font-semibold text-midnight">Privacy reminder:</strong>{" "}
          Do not enter client names, dates of birth, case numbers, or any
          identifying details. Audio is transcribed on your device — nothing is
          recorded or stored by Candela.
        </p>
      </div>

      {/* ── Document type selector ── */}
      <div>
        <p className="form-label">Document type</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select document type">
          {DOCUMENT_TYPES.map((dt) => {
            const isSelected = dt.id === docTypeId;
            return (
              <button
                key={dt.id}
                onClick={() => setDocTypeId(dt.id)}
                type="button"
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-jost font-semibold text-xs tracking-[0.04em] uppercase transition-colors ${
                  isSelected
                    ? "border-gold bg-gold text-midnight"
                    : "border-midnight/20 bg-white/60 text-midnight/70 hover:border-midnight/40 hover:text-midnight"
                }`}
              >
                <span aria-hidden="true">{dt.icon}</span>
                {dt.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Input view ── */}
      {view === "input" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="raw-input" className="form-label">
              Paste your notes or use the record button below
            </label>
            <p className="font-mono text-[10px] text-cerulean uppercase tracking-[0.18em] mb-2">
              Avoid any identifying information
            </p>
            <textarea
              id="raw-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={9}
              className="form-textarea"
              placeholder="Describe what happened in the session — actions taken, client's response, and next steps."
            />
          </div>

          {/* Dictation row */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] text-cerulean uppercase tracking-[0.22em]">
              Post-meeting voice summary
            </p>
            <p className="font-jost font-light text-[12px] text-midnight/50 leading-relaxed max-w-xs">
              After your meeting ends, speak a summary in your own words. Do not
              use this to record live client meetings.
            </p>
            <div className="flex items-center gap-4 mt-1">
              <DictationButton onTranscriptReady={handleTranscriptReady} />
              <span className="font-mono text-[10px] text-midnight/30 uppercase tracking-[0.22em]">
                or
              </span>
            </div>
          </div>

          {/* Process Notes — full width primary action */}
          <button
            onClick={handleProcessFromInput}
            disabled={!hasInputContent || isLoading}
            type="button"
            className="btn-primary w-full justify-center"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing…
              </span>
            ) : (
              "Process Notes"
            )}
          </button>
        </div>
      )}

      {/* ── Transcript review view (step 2 of dictation — cannot be skipped) ── */}
      {view === "review" && (
        <TranscriptReview
          transcript={transcript}
          onTranscriptChange={setTranscript}
          onProcess={handleProcessFromReview}
          onRerecord={handleRerecord}
          isLoading={isLoading}
        />
      )}

      {/* ── Output view ── */}
      {view === "output" && (
        <div className="space-y-4">
          {/* Output card */}
          <div className="bg-stone rounded-xl shadow-sm overflow-hidden">
            <div className="bg-midnight px-4 py-3 flex items-center justify-between">
              <p className="eyebrow text-cerulean">
                {selectedDoc.icon} {selectedDoc.title}
              </p>
              <button
                onClick={handleCopy}
                type="button"
                className={`flex items-center gap-1.5 font-jost font-semibold text-xs px-3 py-1.5 rounded-lg tracking-[0.04em] uppercase transition-all duration-200 ${
                  copied
                    ? "bg-gold text-midnight"
                    : "border border-cerulean text-cerulean hover:bg-cerulean hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  "Copy"
                )}
              </button>
            </div>
            <div className="p-5 sm:p-6">
              <pre className="whitespace-pre-wrap font-jost font-light text-sm text-midnight leading-[1.7]">
                {output}
              </pre>
            </div>
          </div>

          {/* Review reminder */}
          <div className="flex gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <svg
              className="w-4 h-4 text-gold-dark flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p className="font-jost font-light text-sm text-midnight/80 leading-[1.7]">
              <strong className="font-semibold text-midnight">Always review before use.</strong>{" "}
              This is an AI-generated draft — edit as needed before adding to any case record.
            </p>
          </div>

          <button onClick={handleNewNote} type="button" className="btn-secondary">
            New Note
          </button>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error/10 p-4 font-jost text-sm text-error leading-[1.7]"
        >
          {error}
        </div>
      )}

      {/* ── Guided mode link ── */}
      <div className="border-t border-midnight/20 pt-4">
        <a
          href="/"
          className="font-mono text-[11px] text-cerulean hover:text-cerulean-dark transition-colors uppercase tracking-[0.18em]"
        >
          Prefer structured prompts? Use guided mode →
        </a>
      </div>
    </div>
  );
}
