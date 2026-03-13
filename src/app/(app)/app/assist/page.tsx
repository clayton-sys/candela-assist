"use client";

import { useState } from "react";
import { DOCUMENT_TYPES, DocumentTypeId } from "@/lib/documentTypes";
import DocumentTypeCard from "@/components/DocumentTypeCard";
import PrivacyNotice from "@/components/PrivacyNotice";
import DocumentForm from "@/components/DocumentForm";
import OutputDisplay from "@/components/OutputDisplay";
import Link from "next/link";

type AppState = "home" | "form" | "output";

export default function AssistPage() {
  const [appState, setAppState] = useState<AppState>("home");
  const [selectedTypeId, setSelectedTypeId] = useState<DocumentTypeId | null>(null);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingTypeId, setPendingTypeId] = useState<DocumentTypeId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleSelectDocType = (id: string) => {
    if (!privacyAcknowledged) {
      setPendingTypeId(id as DocumentTypeId);
      setShowPrivacyModal(true);
    } else {
      setSelectedTypeId(id as DocumentTypeId);
      setAppState("form");
    }
  };

  const handlePrivacyAcknowledge = () => {
    setPrivacyAcknowledged(true);
    setShowPrivacyModal(false);
    if (pendingTypeId) {
      setSelectedTypeId(pendingTypeId);
      setPendingTypeId(null);
      setAppState("form");
    }
  };

  const handleFormSubmit = async (values: Record<string, string>) => {
    if (!selectedTypeId) return;
    setFormValues(values);
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentTypeId: selectedTypeId, values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft");
      setDraft(data.draft);
      setAppState("output");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAppState("home");
    setSelectedTypeId(null);
    setDraft("");
    setError("");
    setFormValues({});
  };

  const handleEditInputs = () => {
    setAppState("form");
    setDraft("");
    setError("");
  };

  const selectedDocType = DOCUMENT_TYPES.find((d) => d.id === selectedTypeId);

  return (
    <>
      {showPrivacyModal && (
        <PrivacyNotice onAcknowledge={handlePrivacyAcknowledge} />
      )}

      {/* ── Home state — dark gradient, full bleed ── */}
      {appState === "home" && (
        <div className="bg-midnight-gradient">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-24">
            {/* Hero — left aligned */}
            <div className="mb-14 max-w-2xl">
              <h1 className="font-fraunces font-medium text-4xl sm:text-5xl text-stone mb-5 leading-tight tracking-tight">
                Professional documentation,{" "}
                <span className="font-fraunces font-medium italic text-gold">
                  drafted in seconds
                </span>
              </h1>
              <p className="font-jost font-light text-stone/70 text-lg leading-[1.7]">
                Candela Assist helps case managers generate high-quality
                progress notes, referral letters, and safety plans — without
                entering any identifying client information.
              </p>
            </div>

            {/* Document type cards */}
            <p className="eyebrow mb-5">Choose a document type</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map((doc) => (
                <DocumentTypeCard
                  key={doc.id}
                  doc={doc}
                  onSelect={handleSelectDocType}
                />
              ))}
            </div>

            {/* Privacy callout */}
            <div className="mt-12 bg-stone rounded-xl border-l-4 border-cerulean p-5 flex gap-4 items-start">
              <svg
                className="w-5 h-5 text-cerulean flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <p className="eyebrow mb-2">Privacy-first by design</p>
                <p className="font-jost font-light text-midnight/70 text-sm leading-[1.7]">
                  No client data is ever stored. No accounts required. You are
                  the PII filter — describe situations in general terms, never
                  with names, case numbers, or identifying details. The tool
                  generates a draft; you paste it into your own system.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Form state — stone bg (body default) ── */}
      {appState === "form" && selectedDocType && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <DocumentForm
            docType={selectedDocType}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            onBack={handleReset}
          />
          {error && (
            <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl font-jost text-error text-sm">
              {error}
            </div>
          )}
          <div className="mt-6 border-t border-stone/60 pt-4">
            <Link
              href="/app/assist/input"
              className="font-mono text-[11px] text-cerulean hover:text-cerulean-dark transition-colors uppercase tracking-[0.18em]"
            >
              Prefer to dictate or paste? Use Quick Notes &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── Output state — stone bg (body default) ── */}
      {appState === "output" && draft && selectedDocType && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <OutputDisplay
            draft={draft}
            docTitle={selectedDocType.title}
            onReset={handleReset}
            onEdit={handleEditInputs}
          />
        </div>
      )}
    </>
  );
}
