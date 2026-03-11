"use client";

import { useState } from "react";
import { DocumentType } from "@/lib/documentTypes";

interface DocumentFormProps {
  docType: DocumentType;
  onSubmit: (values: Record<string, string>) => void;
  isLoading: boolean;
  onBack: () => void;
}

export default function DocumentForm({
  docType,
  onSubmit,
  isLoading,
  onBack,
}: DocumentFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(docType.fields.map((f) => [f.id, ""]))
  );

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const requiredFields = docType.fields.filter((f) => f.required !== false);
  const allRequiredFilled = requiredFields.every(
    (f) => values[f.id]?.trim().length > 0
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-midnight mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to document types
      </button>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{docType.icon}</span>
        <h2 className="text-2xl font-bold text-midnight">{docType.title}</h2>
      </div>
      <p className="text-gray-600 mb-8">{docType.description}</p>

      <div className="bg-cerulean/10 border border-cerulean/30 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-cerulean mt-0.5 flex-shrink-0">🔒</span>
        <p className="text-sm text-midnight/80">
          <strong className="text-midnight">Privacy reminder:</strong> Describe
          clients in neutral, non-identifying terms. No names, dates of birth,
          or case numbers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {docType.fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="form-label">
              {field.label}
              {field.required !== false && (
                <span className="text-gold ml-1">*</span>
              )}
            </label>

            {field.type === "select" ? (
              <select
                id={field.id}
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="form-input"
                required={field.required !== false}
              >
                <option value="">Select one…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                id={field.id}
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows ?? 3}
                className="form-textarea"
                required={field.required !== false}
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !allRequiredFilled}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating draft…
              </>
            ) : (
              <>
                ✨ Generate Draft
              </>
            )}
          </button>
          {!allRequiredFilled && (
            <p className="text-xs text-gray-400 mt-2">
              Fill in all required fields to generate.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
