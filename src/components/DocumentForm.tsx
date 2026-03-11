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
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-[11px] text-cerulean hover:text-cerulean-dark uppercase tracking-[0.18em] mb-8 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
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

      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl" aria-hidden="true">
          {docType.icon}
        </span>
        <h2 className="font-fraunces font-medium text-2xl text-midnight">
          {docType.title}
        </h2>
      </div>
      <p className="font-jost font-light text-midnight/60 mb-8 leading-[1.7]">
        {docType.description}
      </p>

      {/* Privacy callout */}
      <div className="bg-cerulean/8 border-l-4 border-cerulean rounded-r-xl p-4 mb-8 flex gap-3">
        <svg
          className="w-4 h-4 text-cerulean mt-0.5 flex-shrink-0"
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
          <strong className="font-semibold text-midnight">
            Privacy reminder:
          </strong>{" "}
          Describe clients in neutral, non-identifying terms. No names, dates of
          birth, or case numbers.
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
              <>Generate Draft</>
            )}
          </button>
          {!allRequiredFilled && (
            <p className="font-mono text-[10px] text-cerulean/60 uppercase tracking-[0.18em] mt-2">
              Fill in all required fields to generate.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
