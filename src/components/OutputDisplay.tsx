"use client";

import { useState } from "react";

interface OutputDisplayProps {
  draft: string;
  docTitle: string;
  onReset: () => void;
  onEdit: () => void;
}

export default function OutputDisplay({
  draft,
  docTitle,
  onReset,
  onEdit,
}: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-midnight">Draft Generated</h2>
          <p className="text-gray-500 text-sm mt-0.5">{docTitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="btn-outline text-sm px-4 py-2"
          >
            ← Edit Inputs
          </button>
          <button
            onClick={onReset}
            className="btn-secondary text-sm px-4 py-2"
          >
            New Document
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone rounded-xl overflow-hidden shadow-sm">
        <div className="bg-midnight px-5 py-3 flex items-center justify-between">
          <span className="text-stone/70 text-sm font-medium">
            AI-Generated Draft — Review Before Use
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 ${
              copied
                ? "bg-green-500 text-white"
                : "bg-gold text-midnight hover:bg-gold-dark"
            }`}
          >
            {copied ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          <pre className="whitespace-pre-wrap font-sans text-midnight text-sm leading-relaxed">
            {draft}
          </pre>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gold/10 border border-gold/30 rounded-xl flex gap-3">
        <span className="text-gold flex-shrink-0 mt-0.5">⚠️</span>
        <p className="text-sm text-midnight/80">
          <strong className="text-midnight">Always review before use.</strong>{" "}
          AI-generated drafts may contain errors or miss important context.
          Edit as needed before entering into your case management system.
        </p>
      </div>
    </div>
  );
}
