"use client";

import { useState } from "react";
import { DOCUMENT_TYPES, DocumentTypeId } from "@/lib/documentTypes";
import DocumentTypeCard from "@/components/DocumentTypeCard";
import PrivacyNotice from "@/components/PrivacyNotice";
import DocumentForm from "@/components/DocumentForm";
import OutputDisplay from "@/components/OutputDisplay";

type AppState = "home" | "form" | "output";

export default function Home() {
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

      {appState === "home" && (
        <div>
          {/* Hero */}
          <div className="text-center mb-12 pt-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-midnight mb-4 tracking-tight">
              Professional documentation,{" "}
              <span className="text-gold">drafted in seconds</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Candela Assist helps case managers generate high-quality progress
              notes, referral letters, and safety plans — without entering any
              identifying client information.
            </p>
          </div>

          {/* Document Type Selector */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Choose a document type
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map((doc) => (
                <DocumentTypeCard
                  key={doc.id}
                  doc={doc}
                  onSelect={handleSelectDocType}
                />
              ))}
            </div>
          </div>

          {/* Privacy callout */}
          <div className="mt-10 bg-midnight rounded-2xl p-6 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-xl flex-shrink-0">
              🔒
            </div>
            <div>
              <h3 className="font-bold text-stone mb-1">Privacy-first by design</h3>
              <p className="text-stone/70 text-sm leading-relaxed">
                No client data is ever stored. No accounts required. You are the
                PII filter — describe situations in general terms, never with
                names, case numbers, or identifying details. The tool generates
                a draft; you paste it into your own system.
              </p>
            </div>
          </div>
        </div>
      )}

      {appState === "form" && selectedDocType && (
        <div className="max-w-2xl">
          <DocumentForm
            docType={selectedDocType}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            onBack={handleReset}
          />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {appState === "output" && draft && selectedDocType && (
        <OutputDisplay
          draft={draft}
          docTitle={selectedDocType.title}
          onReset={handleReset}
          onEdit={handleEditInputs}
        />
      )}
    </>
  );
}
